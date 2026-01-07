<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\ExternalInvoice\StoreExternalInvoiceRequest;
use App\Http\Requests\V1\ExternalInvoice\UpdateExternalInvoiceRequest;
use App\Http\Resources\V1\ExternalInvoiceResource;
use App\Models\ExternalInvoice;
use App\QueryParameters\ExternalInvoiceParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Support\Facades\Schema;
use App\Services\TransactionFlowService;

class ExternalInvoiceController extends Controller
{
    /**
     * Display a listing of the external invoices.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $invoices = QueryBuilder::for(ExternalInvoice::class)
            ->allowedFilters(ExternalInvoiceParameters::ALLOWED_FILTERS)
            ->allowedSorts(ExternalInvoiceParameters::ALLOWED_SORTS)
            ->allowedIncludes(ExternalInvoiceParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($invoices->isEmpty()) {
            return response()->json([
                'message' => 'No external invoices found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return ExternalInvoiceResource::collection($invoices);
    }

    /**
     * Store a newly created external invoice in storage.
     */
    public function store(StoreExternalInvoiceRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();
            
            // Set default values
            $data['invoice_id'] = $this->generateInvoiceId();
            $data['type'] = $data['type'] ?? 'Cash';
            $data['status'] = 'UnPaid'; // Always set to UnPaid on creation
            
            // Handle file upload if present
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('invoices', $fileName, 'public');
                
                $data['attachment_path'] = $filePath;
                $data['original_name'] = $file->getClientOriginalName();
            }

            // Create the invoice
            $invoice = ExternalInvoice::create($data);

            // Accounting entries for external invoice:
            // Credit: Liabilities (Account 2) with total amount
            // Debit: Cost of Purchases (Account 5) with base amount (restored to original logic)
            // Note: Account 14 (VAT Receivable) is NOT automatically updated - user must manually edit it
            $totalAmount = $data['amount'] + $data['vat_amount'];
            $amount = $data['amount'];
            $vatAmount = $data['vat_amount'];
            
            \Log::info('Creating external invoice accounting entries', [
                'invoice_id' => $invoice->id,
                'base_amount' => $amount,
                'vat_amount' => $vatAmount,
                'total_amount' => $totalAmount,
                'accounting' => [
                    'credit_account_2' => $totalAmount,
                    'debit_account_5' => $amount,
                    'note' => 'Account 14 is NOT automatically updated - user must manually edit it'
                ]
            ]);
            
            // Credit Liabilities (Account 2) with total amount
            DB::table('accounts')
                ->where('id', 2)
                ->increment('credit_amount', $totalAmount);
                
            TransactionFlowService::recordTransactionFlow(
                2, // account_id
                'credit',
                $totalAmount,
                'external_invoice',
                $invoice->id,
                [],
                'External invoice created - Liabilities increased',
                $invoice->invoice_id,
                now()->toDateString(),
                $invoice->attachment_path,
                $invoice->original_name
            );

            // Debit Cost of Purchases (Account 5) with base amount (original logic - restored)
            DB::table('accounts')
                ->where('id', 5)
                ->increment('debit_amount', $amount);
                
            TransactionFlowService::recordTransactionFlow(
                5, // account_id
                'debit',
                $amount,
                'external_invoice',
                $invoice->id,
                [],
                'Cost of Purchases debited for external invoice (base amount)',
                $invoice->invoice_id,
                now()->toDateString(),
                $invoice->attachment_path,
                $invoice->original_name
            );

            // Note: Account 14 (VAT Receivable) is NOT automatically updated
            // It should only be updated when the user manually edits it through the Accounts modal

            DB::commit();

            return response()->json([
                'message' => 'External invoice created successfully',
                'data' => new ExternalInvoiceResource(
                    $invoice->load(['user', 'supplier', 'purchaseOrder'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to create external invoice', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to create external invoice',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified external invoice.
     */
    public function show(string $id): JsonResponse
    {
        $invoice = QueryBuilder::for(ExternalInvoice::class)
            ->allowedIncludes(ExternalInvoiceParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new ExternalInvoiceResource($invoice)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified external invoice in storage.
     */
    public function update(UpdateExternalInvoiceRequest $request, ExternalInvoice $externalInvoice): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();
            
            // Store old amounts for account adjustment
            $oldAmount = $externalInvoice->amount;
            $oldVatAmount = $externalInvoice->vat_amount;
            
            // Handle file upload if present
            if ($request->hasFile('attachment')) {
                $file = $request->file('attachment');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('invoices', $fileName, 'public');
                
                $data['attachment_path'] = $filePath;
                $data['original_name'] = $file->getClientOriginalName();
            }

            $externalInvoice->update($data);

            // Update account ID 2 if amounts changed
            if (isset($data['amount']) || isset($data['vat_amount'])) {
                $newAmount = $data['amount'] ?? $externalInvoice->amount;
                $newVatAmount = $data['vat_amount'] ?? $externalInvoice->vat_amount;
                
                $oldTotal = $oldAmount + $oldVatAmount;
                $newTotal = $newAmount + $newVatAmount;
                $difference = $newTotal - $oldTotal;
                
                if ($difference != 0) {
                    \Log::info('Updating account ID 2 on invoice update', [
                        'invoice_id' => $externalInvoice->id,
                        'old_total' => $oldTotal,
                        'new_total' => $newTotal,
                        'difference' => $difference
                    ]);
                    
                    DB::table('accounts')
                        ->where('id', 2)
                        ->increment('credit_amount', $difference);
                    TransactionFlowService::recordTransactionFlow(
                        2,
                        $difference > 0 ? 'credit' : 'debit',
                        abs($difference),
                        'external_invoice',
                        $externalInvoice->id,
                        [],
                        'External invoice updated',
                        $externalInvoice->invoice_id,
                        now()->toDateString(),
                        $externalInvoice->attachment_path,
                        $externalInvoice->original_name
                    );
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'External invoice updated successfully',
                'data' => new ExternalInvoiceResource(
                    $externalInvoice->load(['user', 'supplier', 'purchaseOrder'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to update external invoice', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to update external invoice',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified external invoice from storage.
     */
    public function destroy(ExternalInvoice $externalInvoice): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Store amounts for account adjustment
            $amount = $externalInvoice->amount;
            $vatAmount = $externalInvoice->vat_amount;
            $totalAmount = $amount + $vatAmount;

            // Use forceDelete for hard delete
            $externalInvoice->forceDelete();

            // Update account ID 2 by subtracting the total amount
            DB::table('accounts')
                ->where('id', 2)
                ->decrement('credit_amount', $totalAmount);

            TransactionFlowService::recordTransactionFlow(
                2,
                'debit',
                $totalAmount,
                'external_invoice',
                $externalInvoice->id,
                [],
                'External invoice deleted',
                $externalInvoice->invoice_id,
                now()->toDateString(),
                $externalInvoice->attachment_path,
                $externalInvoice->original_name
            );

            DB::commit();

            return response()->json([
                'message' => 'External invoice deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete external invoice',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    private function generateInvoiceId(): string
    {
        $prefix = 'EXT-INV-';
        $lastInvoice = ExternalInvoice::orderBy('id', 'desc')->first();
        
        if (!$lastInvoice) {
            return $prefix . '0001';
        }

        $lastNumber = 0;
        if (preg_match('/-(\d+)$/', $lastInvoice->invoice_id, $matches)) {
            $lastNumber = intval($matches[1]);
        }
        
        $nextNumber = $lastNumber + 1;
        return $prefix . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Get purchase orders that don't have external invoices.
     */
    public function getAvailablePurchaseOrders()
    {
        try {
            \Log::info('Starting getAvailablePurchaseOrders');
            
            // Check if purchase_orders table exists
            if (!Schema::hasTable('purchase_orders')) {
                \Log::warning('purchase_orders table does not exist');
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }
            
            // Execute raw SQL query without model dependency
            $purchaseOrders = DB::select("
                SELECT p.id, p.purchase_order_no 
                FROM purchase_orders p 
                LEFT JOIN external_invoices ei ON p.id = ei.purchase_order_id 
                WHERE ei.id IS NULL
                ORDER BY p.id DESC
            ");

            if (!$purchaseOrders) {
                return response()->json([
                    'success' => true,
                    'data' => []
                ]);
            }

            \Log::info('Query result:', [
                'count' => count($purchaseOrders),
                'data' => $purchaseOrders
            ]);

            return response()->json([
                'success' => true,
                'data' => $purchaseOrders
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in getAvailablePurchaseOrders:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Return empty data instead of error
            return response()->json([
                'success' => true,
                'data' => [],
                'debug_error' => $e->getMessage()
            ]);
        }
    }
}
