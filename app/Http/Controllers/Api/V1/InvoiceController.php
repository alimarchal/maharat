<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Invoice\StoreInvoiceRequest;
use App\Http\Requests\V1\Invoice\UpdateInvoiceRequest;
use App\Http\Resources\V1\InvoiceResource;
use App\Http\Resources\V1\InvoiceCollection;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\QueryParameters\InvoiceParameters;
use App\Services\BudgetValidationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Illuminate\Support\Facades\Log;

class InvoiceController extends Controller
{
    /**
     * Calculate line item totals
     */
    private function calculateItemTotals(array $item): array
    {
        $quantity = $item['quantity'];
        $unitPrice = $item['unit_price'];
        $taxRate = $item['tax_rate'];

        $subtotal = $quantity * $unitPrice;
        $taxAmount = $subtotal * ($taxRate / 100);
        $total = $subtotal + $taxAmount;

        return [
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total' => $total
        ];
    }

    /**
     * Calculate invoice totals based on items
     */
    private function calculateInvoiceTotals(array $items): array
    {
        $subtotal = 0;
        $taxAmount = 0;
        $totalAmount = 0;

        foreach ($items as $item) {
            $calculatedItem = $this->calculateItemTotals($item);
            $subtotal += $calculatedItem['subtotal'];
            $taxAmount += $calculatedItem['tax_amount'];
            $totalAmount += $calculatedItem['total'];
        }

        return [
            'subtotal' => $subtotal,
            'tax_amount' => $taxAmount,
            'total_amount' => $totalAmount
        ];
    }

    /**
     * Display a listing of invoices.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $invoices = QueryBuilder::for(Invoice::class)
            ->allowedFilters(InvoiceParameters::getAllowedFilters())
            ->allowedSorts(InvoiceParameters::ALLOWED_SORTS)
            ->allowedIncludes(InvoiceParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($invoices->isEmpty()) {
            return response()->json([
                'message' => 'No invoices found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return new InvoiceCollection($invoices);
    }

    /**
     * Store a newly created invoice in storage.
     */
    public function store(StoreInvoiceRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Get validated data
            $validatedData = $request->validated();

            // Add the authenticated user's ID as creator
            $validatedData['created_by'] = auth()->id();
            $validatedData['updated_by'] = auth()->id();

            // Budget validation for invoice creation
            $budgetService = new BudgetValidationService();
            
            // Get applicable fiscal periods for invoice date
            $fiscalPeriods = $budgetService->getApplicableFiscalPeriods($validatedData['issue_date']);
            
            if ($fiscalPeriods->isEmpty()) {
                throw new \Exception('Invoice date is not within any fiscal period range');
            }

            $fiscalPeriodId = null;
            
            // If multiple periods overlap, use the one provided in request or the most specific
            if ($fiscalPeriods->count() > 1) {
                if ($request->has('fiscal_period_id')) {
                    $fiscalPeriodId = $request->input('fiscal_period_id');
                    // Validate that the provided period is actually applicable
                    if (!$fiscalPeriods->contains('id', $fiscalPeriodId)) {
                        throw new \Exception('Selected fiscal period is not applicable for this invoice date');
                    }
                } else {
                    // Use the most specific period (shortest duration)
                    $fiscalPeriodId = $fiscalPeriods->first()->id;
                }
            } else {
                $fiscalPeriodId = $fiscalPeriods->first()->id;
            }

            // For invoices, we need to validate that there's a budget available for revenue tracking
            // This is different from purchase orders - we're checking if there's a budget to track revenue
            $budgetValidation = $budgetService->validateBudgetAvailability(
                null, // No department required for invoices
                null, // No cost center required for invoices
                null, // No sub cost center for invoices
                $fiscalPeriodId,
                0, // For invoices, we don't need to reserve budget, just check if budget exists
                'invoice' // Specify that this is for invoice validation
            );

            if (!$budgetValidation['valid']) {
                throw new \Exception('No approved budget found for the specified criteria. Cannot create invoice without proper budget allocation.');
            }

            // Create invoice
            $invoice = Invoice::create($validatedData);

            // Handle invoice items if provided
            if ($request->has('items') && is_array($request->input('items'))) {
                foreach ($request->input('items') as $itemData) {
                    $itemData['invoice_id'] = $invoice->id;
                    InvoiceItem::create($itemData);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Invoice created successfully',
                'data' => new InvoiceResource($invoice->load(['items', 'client', 'representative']))
            ], Response::HTTP_CREATED);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create invoice',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified invoice.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $invoice = QueryBuilder::for(Invoice::class)
                ->allowedIncludes(InvoiceParameters::ALLOWED_INCLUDES)
                ->findOrFail($id);

            return response()->json([
                'data' => new InvoiceResource($invoice)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Invoice not found',
                'error' => $e->getMessage()
            ], Response::HTTP_NOT_FOUND);
        }
    }

    /**
     * Update the specified invoice in storage.
     */
    public function update(UpdateInvoiceRequest $request, string $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($id);
            $validatedData = $request->validated();

            // Add the authenticated user's ID as updater
            $validatedData['updated_by'] = auth()->id();

            // Budget validation for invoice update
            if ($request->has('issue_date')) {
                $budgetService = new BudgetValidationService();
                
                // Get applicable fiscal periods for invoice date
                $fiscalPeriods = $budgetService->getApplicableFiscalPeriods($validatedData['issue_date']);
                
                if ($fiscalPeriods->isEmpty()) {
                    throw new \Exception('Invoice date is not within any fiscal period range');
                }

                $fiscalPeriodId = null;
                
                // If multiple periods overlap, use the one provided in request or the most specific
                if ($fiscalPeriods->count() > 1) {
                    if ($request->has('fiscal_period_id')) {
                        $fiscalPeriodId = $request->input('fiscal_period_id');
                        // Validate that the provided period is actually applicable
                        if (!$fiscalPeriods->contains('id', $fiscalPeriodId)) {
                            throw new \Exception('Selected fiscal period is not applicable for this invoice date');
                        }
                    } else {
                        // Use the most specific period (shortest duration)
                        $fiscalPeriodId = $fiscalPeriods->first()->id;
                    }
                } else {
                    $fiscalPeriodId = $fiscalPeriods->first()->id;
                }

                // Validate budget availability
                $budgetValidation = $budgetService->validateBudgetAvailability(
                    null, // No department required for invoices
                    null, // No cost center required for invoices
                    null, // No sub cost center for invoices
                    $fiscalPeriodId,
                    0, // For invoices, we don't need to reserve budget, just check if budget exists
                    'invoice' // Specify that this is for invoice validation
                );

                if (!$budgetValidation['valid']) {
                    throw new \Exception('No approved budget found for the specified criteria. Cannot update invoice without proper budget allocation.');
                }
            }

            $invoice->update($validatedData);

            DB::commit();

            return response()->json([
                'message' => 'Invoice updated successfully',
                'data' => new InvoiceResource($invoice->load(['items', 'client', 'representative']))
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update invoice',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified invoice from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($id);
            $invoice->delete();

            DB::commit();

            return response()->json([
                'message' => 'Invoice deleted successfully'
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete invoice',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get applicable fiscal periods for a given date
     */
    public function getApplicableFiscalPeriods(Request $request): JsonResponse
    {
        try {
            $date = $request->input('date');
            if (!$date) {
                return response()->json([
                    'success' => false,
                    'message' => 'Date parameter is required'
                ], Response::HTTP_BAD_REQUEST);
            }

            $budgetService = new BudgetValidationService();
            $fiscalPeriods = $budgetService->getApplicableFiscalPeriods($date);

            return response()->json([
                'success' => true,
                'data' => $fiscalPeriods,
                'message' => $fiscalPeriods->count() > 1 
                    ? 'Multiple fiscal periods overlap for this date. Please select one.' 
                    : 'Fiscal period found'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error getting applicable fiscal periods: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to get applicable fiscal periods',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Validate budget availability for invoice creation
     */
    public function validateBudget(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'department_id' => 'nullable|integer',
                'cost_center_id' => 'nullable|integer',
                'sub_cost_center_id' => 'nullable|integer',
                'fiscal_period_id' => 'required|integer',
                'amount' => 'required|numeric|min:0'
            ]);

            $budgetService = new BudgetValidationService();
            $validation = $budgetService->validateBudgetAvailability(
                $request->input('department_id'),
                $request->input('cost_center_id'),
                $request->input('sub_cost_center_id'),
                $request->input('fiscal_period_id'),
                $request->input('amount'),
                'invoice' // Specify that this is for invoice validation
            );

            return response()->json([
                'success' => $validation['valid'],
                'data' => $validation
            ]);
        } catch (\Exception $e) {
            \Log::error('Error validating budget: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to validate budget',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Add items to an invoice
     */
    public function addItems(Request $request, string $id): JsonResponse
    {
        try {
            DB::beginTransaction();

            $invoice = Invoice::findOrFail($id);
            
            $request->validate([
                'items' => 'required|array',
                'items.*.name' => 'required|string',
                'items.*.description' => 'nullable|string',
                'items.*.quantity' => 'required|numeric|min:0',
                'items.*.unit_price' => 'required|numeric|min:0',
                'items.*.subtotal' => 'required|numeric|min:0',
                'items.*.tax_rate' => 'nullable|numeric|min:0',
                'items.*.tax_amount' => 'nullable|numeric|min:0',
                'items.*.total' => 'required|numeric|min:0',
            ]);

            foreach ($request->input('items') as $itemData) {
                $itemData['invoice_id'] = $invoice->id;
                InvoiceItem::create($itemData);
            }

            DB::commit();

            return response()->json([
                'message' => 'Invoice items added successfully',
                'data' => new InvoiceResource($invoice->load(['items', 'client', 'representative']))
            ], Response::HTTP_CREATED);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to add invoice items',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Upload a PDF document for an invoice
     */
    public function uploadDocument(Request $request, $id)
    {
        try {
            $invoice = Invoice::findOrFail($id);

            $request->validate([
                'invoice_document' => 'required|file|mimes:pdf|max:10240', // max 10MB
            ]);

            $file = $request->file('invoice_document');
            $path = $file->store('invoices', 'public');

            // Update invoice with document path
            $invoice->update([
                'document_path' => $path,
                'document_name' => $file->getClientOriginalName()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Document uploaded successfully',
                'document_url' => Storage::disk('public')->url($path)
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            \Log::error('Failed to upload document: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'Failed to upload document',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update the status of an invoice
     */
    public function updateStatus(Request $request, $id)
    {
        try {
            Log::info('Invoice status update endpoint called', [
                'invoice_id' => $id,
                'request_data' => $request->all(),
                'auth_user' => auth()->id()
            ]);

            $invoice = Invoice::findOrFail($id);
            
            Log::info('Found Invoice for status update', [
                'invoice_id' => $id,
                'current_status' => $invoice->status,
                'new_status' => $request->input('status')
            ]);
            
            // Update status
            $invoice->status = $request->input('status');
            
            Log::info('About to save Invoice with new status', [
                'invoice_id' => $id,
                'new_status' => $invoice->status,
                'is_dirty' => $invoice->isDirty(),
                'changes' => $invoice->getDirty()
            ]);

            $updated = $invoice->save();
            
            Log::info('Invoice status update save result', [
                'invoice_id' => $id,
                'update_success' => $updated,
                'final_status' => $invoice->status,
                'is_dirty' => $invoice->isDirty(),
                'changes' => $invoice->getDirty()
            ]);

            // Verify the update
            $refreshedInvoice = Invoice::find($id);
            Log::info('Final Invoice status verification', [
                'invoice_id' => $id,
                'status' => $refreshedInvoice->status,
                'expected_status' => $request->input('status')
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Invoice status updated successfully',
                'data' => new InvoiceResource($invoice)
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update Invoice status', [
                'invoice_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update Invoice status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the next invoice number
     */
    public function getNextInvoiceNumber(): JsonResponse
    {
        try {
            $nextInvoiceNumber = $this->generateInvoiceNumber();
            
            return response()->json([
                'success' => true,
                'next_number' => $nextInvoiceNumber
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            \Log::error('Error generating next invoice number: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate next invoice number',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Generate unique invoice number
     */
    private function generateInvoiceNumber(): string
    {
        // Get the latest invoice number
        $latestInvoice = Invoice::orderBy('id', 'desc')->first();
        
        if ($latestInvoice) {
            // Extract the numeric part from the latest invoice number
            $match = preg_match('/INV-(\d+)/', $latestInvoice->invoice_number, $matches);
            if ($match && isset($matches[1])) {
                $nextNumber = intval($matches[1]) + 1;
            } else {
                $nextNumber = 1;
            }
        } else {
            $nextNumber = 1;
        }
        
        // Format as INV-XXXXX (5 digits with leading zeros)
        return 'INV-' . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);
    }
}
