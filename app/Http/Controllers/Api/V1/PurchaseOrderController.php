<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\PurchaseOrder\StorePurchaseOrderRequest;
use App\Http\Requests\V1\PurchaseOrder\UpdatePurchaseOrderRequest;
use App\Http\Resources\V1\PurchaseOrderResource;
use App\Models\PurchaseOrder;
use App\QueryParameters\PurchaseOrderParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use App\Services\PurchaseOrderBudgetService;
use App\Models\RequestBudget;
use App\Services\BudgetValidationService;

class PurchaseOrderController extends Controller
{

    /**
     * Display a listing of the resource.
     */
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $quotationId = $request->input('quotation_id');
            $hasPaymentOrder = $request->boolean('has_payment_order');
            $hasGoodReceiveNote = $request->boolean('has_good_receive_note');

            // Start building the query
            $query = QueryBuilder::for(PurchaseOrder::class)
                ->allowedFilters(PurchaseOrderParameters::ALLOWED_FILTERS)
                ->allowedSorts(PurchaseOrderParameters::ALLOWED_SORTS)
                ->allowedIncludes(PurchaseOrderParameters::ALLOWED_INCLUDES);

            // Apply quotation_id filter if provided
            if ($quotationId) {
                $query->where('quotation_id', $quotationId);
            }

            // Filter based on has_payment_order parameter
            if ($request->has('has_payment_order')) {
                if ($hasPaymentOrder) {
                    // Get purchase orders that have payment orders
                    $query->whereHas('paymentOrders');
                } else {
                    // Get purchase orders that do NOT have payment orders
                    $query->whereDoesntHave('paymentOrders');
                }
            }

            if ($request->has('has_good_receive_note')) {
                if ($hasGoodReceiveNote) {
                    // Get purchase orders that have payment orders
                    $query->whereHas('goodReceiveNote');
                } else {
                    // Get purchase orders that do NOT have payment orders
                    $query->whereDoesntHave('goodReceiveNote');
                }
            }

            // Now paginate the results after all conditions are applied
            $purchaseOrders = $query->paginate()
                ->appends(request()->query());

            return response()->json([
                'data' => PurchaseOrderResource::collection($purchaseOrders)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            \Log::error('Error fetching purchase orders: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'message' => 'Error fetching purchase orders',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
    public function getNextPurchaseOrderNumber(): JsonResponse
    {
        try {
            $nextNumber = $this->generatePurchaseOrderNumber();
            \Log::info('Generated next purchase order number: ' . $nextNumber);
            return response()->json([
                'success' => true,
                'next_number' => $nextNumber
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to generate next purchase order number: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate next purchase order number: ' . $e->getMessage()
            ], 500);
        }
    }


    public function store(StorePurchaseOrderRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Get validated data except the attachment
            $validatedData = $request->safe()->except(['attachment']);

            // Add the authenticated user's ID as creator
            $validatedData['user_id'] = auth()->id();

            // Generate unique purchase order number
            $validatedData['purchase_order_no'] = $this->generatePurchaseOrderNumber();

            // Budget validation
            $budgetService = new BudgetValidationService();
            
            // Get quotation to determine RFQ details
            $quotation = \App\Models\Quotation::with('rfq')->find($validatedData['quotation_id']);
            if (!$quotation || !$quotation->rfq) {
                throw new \Exception('Quotation or associated RFQ not found');
            }

            $rfq = $quotation->rfq;
            
            // Get applicable fiscal periods for RFQ issue date
            $fiscalPeriods = $budgetService->getApplicableFiscalPeriods($rfq->request_date);
            
            if ($fiscalPeriods->isEmpty()) {
                throw new \Exception('RFQ date is not within any fiscal period range');
            }

            $fiscalPeriodId = null;
            
            // If multiple periods overlap, use the one provided in request or the most specific
            if ($fiscalPeriods->count() > 1) {
                if ($request->has('fiscal_period_id')) {
                    $fiscalPeriodId = $request->input('fiscal_period_id');
                    // Validate that the provided period is actually applicable
                    if (!$fiscalPeriods->contains('id', $fiscalPeriodId)) {
                        throw new \Exception('Selected fiscal period is not applicable for this RFQ date');
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
                $rfq->department_id,
                $rfq->cost_center_id,
                $rfq->sub_cost_center_id,
                $fiscalPeriodId,
                $validatedData['amount']
            );

            if (!$budgetValidation['valid']) {
                throw new \Exception($budgetValidation['message']);
            }

            // Reserve budget
            $budgetService->reserveBudget($budgetValidation['budget'], $validatedData['amount']);

            // Add fiscal period and budget info to purchase order
            $validatedData['fiscal_period_id'] = $fiscalPeriodId;
            $validatedData['request_budget_id'] = $budgetValidation['budget']->id;

            // Create purchase order
            $purchaseOrder = PurchaseOrder::create($validatedData);

            // Handle file upload if provided
            if ($request->hasFile('attachment')) {
                $path = $request->file('attachment')->store('purchase-orders','public');
                $purchaseOrder->attachment = $path;
                $purchaseOrder->original_name = $request->file('attachment')->getClientOriginalName();
                $purchaseOrder->save();
            }

            DB::commit();

            return response()->json([
                'message' => 'Purchase order created successfully',
                'data' => new PurchaseOrderResource(
                    $purchaseOrder->load([
                        'quotation',
                        'supplier',
                        'user',
                        'department',
                        'costCenter',
                        'subCostCenter',
                        'warehouse',
                        'requestBudget',
                        'fiscalPeriod'
                        ])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to create purchase order: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'message' => 'Failed to create purchase order',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified resource.
     */

    public function show(string $id)
    {
        try {
            $purchaseOrder = PurchaseOrder::with([
                'quotation',
                'supplier',
                'user',
                'department',
                'costCenter',
                'subCostCenter',
                'requestForQuotation.warehouse',
                'requestForQuotation.items.product.category',
                'requestForQuotation.items.product.unit',
            ])->findOrFail($id);

            return response()->json([
                'data' => new PurchaseOrderResource($purchaseOrder)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve purchase order',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePurchaseOrderRequest $request, PurchaseOrder $purchaseOrder)
    {


        try {
            DB::beginTransaction();

            // Get validated data except the attachment
            $validatedData = $request->safe()->except(['attachment']);
            // Update purchase order
            $purchaseOrder->update($validatedData);

            // Handle file upload if provided
            if ($request->hasFile('attachment')) {
                // Delete old file if exists
                if ($purchaseOrder->attachment && Storage::disk('public')->exists($purchaseOrder->attachment)) {
                    Storage::disk('public')->delete($purchaseOrder->attachment);
                }

                // Store new file
                $path = $request->file('attachment')->store('purchase-orders', 'public');
                $purchaseOrder->attachment = $path;
                $purchaseOrder->original_name = $request->file('attachment')->getClientOriginalName();
                $purchaseOrder->save();
            }

            DB::commit();

            return response()->json([
                'message' => 'Purchase order updated successfully',
                'data' => new PurchaseOrderResource(
                    $purchaseOrder->load([
                        'quotation',
                        'supplier',
                        'department',
                        'costCenter',
                        'subCostCenter',
                        'warehouse',
                        'requestForQuotation',
                    ])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update purchase order',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }



    public function destroy(PurchaseOrder $purchaseOrder): JsonResponse
    {
        try {
            DB::beginTransaction();

            $purchaseOrder->delete();

            DB::commit();

            return response()->json([
                'message' => 'Purchase order deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete purchase order',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Generate a unique purchase order number
     * Format: PO-YYYY-XXXX (e.g., PO-2025-0001)
     */
    private function generatePurchaseOrderNumber(): string
    {
        $year = date('Y');

        // Find the last purchase order for the current year
        $lastPurchaseOrder = PurchaseOrder::whereYear('created_at', $year)
            ->orderBy('purchase_order_no', 'desc')
            ->first();

        $newNumber = 1; // Default to 1 if no purchase order exists

        if ($lastPurchaseOrder && preg_match('/PO-\d{4}-(\d+)/', $lastPurchaseOrder->purchase_order_no, $matches)) {
            $newNumber = (int)$matches[1] + 1;
        }

        return sprintf("PO-%s-%04d", $year, $newNumber);
    }

    /**
     * Upload a document to the purchase order
     */
    public function uploadDocument(Request $request, $id): JsonResponse
    {
        try {
            $purchaseOrder = PurchaseOrder::findOrFail($id);

            if (!$request->hasFile('purchase_order_document')) {
                return response()->json([
                    'success' => false,
                    'message' => 'No document provided'
                ], Response::HTTP_BAD_REQUEST);
            }

            $file = $request->file('purchase_order_document');
            $filename = 'po_' . $purchaseOrder->purchase_order_no . '_' . time() . '.' . $file->getClientOriginalExtension();

            // Store the document
            $path = $file->storeAs('purchase-orders/documents', $filename, 'public');

            // Update the purchase order with the generated document
            $purchaseOrder->generated_document = $path;

            // If update_attachment flag is set, also update the attachment column
            if ($request->boolean('update_attachment')) {
                // Remove old attachment if exists
                if ($purchaseOrder->attachment && Storage::disk('public')->exists($purchaseOrder->attachment)) {
                    Storage::disk('public')->delete($purchaseOrder->attachment);
                }

                $purchaseOrder->attachment = $path;
                $purchaseOrder->original_name = $file->getClientOriginalName();
            }

            $purchaseOrder->save();

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
     * Validate budget availability for purchase order creation
     */
    public function validateBudget(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'department_id' => 'required|integer',
                'cost_center_id' => 'required|integer',
                'sub_cost_center_id' => 'required|integer',
                'fiscal_period_id' => 'required|integer',
                'amount' => 'required|numeric|min:0'
            ]);

            $budgetService = new BudgetValidationService();
            $validation = $budgetService->validateBudgetAvailability(
                $request->input('department_id'),
                $request->input('cost_center_id'),
                $request->input('sub_cost_center_id'),
                $request->input('fiscal_period_id'),
                $request->input('amount')
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
}
