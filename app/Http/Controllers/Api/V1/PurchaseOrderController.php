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
use App\Models\Quotation;
use App\Services\ApproverResolver;
use App\Models\ProcessStep;
use App\Models\User;

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
                    // Get purchase orders that have good receive notes
                    $query->whereHas('goodReceiveNote');
                } else {
                    // Get purchase orders that do NOT have good receive notes OR are partially delivered
                    $query->where(function($q) {
                        $q->whereDoesntHave('goodReceiveNote')
                          ->orWhereHas('goodReceiveNote', function($grnQuery) {
                              $grnQuery->where('status', 'Partially Delivered');
                          });
                    });
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
            \Log::info('PurchaseOrder Store - Starting creation process');
            \Log::info('PurchaseOrder Store - Request data: ' . json_encode($request->all()));
            
            DB::beginTransaction();

            // Get validated data except the attachment
            $validatedData = $request->safe()->except(['attachment']);
            \Log::info('PurchaseOrder Store - Validated data: ' . json_encode($validatedData));

            // Add the authenticated user's ID as creator
            $validatedData['user_id'] = auth()->id();
            \Log::info('PurchaseOrder Store - User ID: ' . auth()->id());

            // Generate unique purchase order number
            $validatedData['purchase_order_no'] = $this->generatePurchaseOrderNumber();
            \Log::info('PurchaseOrder Store - Generated PO number: ' . $validatedData['purchase_order_no']);

            // Budget validation
            $budgetService = new BudgetValidationService();
            
            // Get quotation to determine RFQ details
            $quotation = Quotation::with('rfq')->find($validatedData['quotation_id']);
            if (!$quotation || !$quotation->rfq) {
                throw new \Exception('Quotation or associated RFQ not found');
            }

            $rfq = $quotation->rfq;
            \Log::info('PurchaseOrder Store - RFQ data: ' . json_encode([
                'rfq_id' => $rfq->id,
                'department_id' => $rfq->department_id,
                'cost_center_id' => $rfq->cost_center_id,
                'sub_cost_center_id' => $rfq->sub_cost_center_id,
                'request_date' => $rfq->request_date
            ]));
            
            // Get applicable fiscal periods for RFQ issue date
            $fiscalPeriods = $budgetService->getApplicableFiscalPeriods($rfq->request_date);
            \Log::info('PurchaseOrder Store - Found fiscal periods: ' . $fiscalPeriods->count());
            
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

            \Log::info('PurchaseOrder Store - Selected fiscal period ID: ' . $fiscalPeriodId);

            // Calculate total amount including VAT for budget validation
            $baseAmount = floatval($validatedData['amount'] ?? 0);
            $vatAmount = floatval($validatedData['vat_amount'] ?? 0);
            $totalAmount = $baseAmount + $vatAmount;

            \Log::info('PurchaseOrder Store - Amount calculation', [
                'base_amount' => $baseAmount,
                'vat_amount' => $vatAmount,
                'total_amount' => $totalAmount
            ]);

            // Validate budget availability with total amount (including VAT)
            $budgetValidation = $budgetService->validateBudgetAvailability(
                $rfq->department_id,
                $rfq->cost_center_id,
                $rfq->sub_cost_center_id,
                $fiscalPeriodId,
                $totalAmount
            );

            \Log::info('PurchaseOrder Store - Budget validation result: ' . json_encode($budgetValidation));

            // Check if alternative subcost center is provided when budget fails
            $alternativeSubCostCenterId = $request->input('alternative_sub_cost_center_id');
            $shortfallAmount = null;
            $alternatives = [];
            
            if (!$budgetValidation['valid']) {
                // If budget validation failed, check if alternative subcost center is provided
                if (!$alternativeSubCostCenterId) {
                    // Return error with alternatives for frontend to display
                    return response()->json([
                        'message' => $budgetValidation['message'],
                        'error' => $budgetValidation['message'],
                        'alternatives' => $budgetValidation['alternatives'] ?? [],
                        'shortfall_amount' => $budgetValidation['shortfall_amount'] ?? 0,
                        'available_amount' => $budgetValidation['available_amount'] ?? 0
                    ], Response::HTTP_BAD_REQUEST);
                }
                
                // Alternative subcost center provided - create reallocation request instead of reserving budget
                $availableAmount = $budgetValidation['available_amount'] ?? 0;
                $shortfallAmount = $budgetValidation['shortfall_amount'] ?? $totalAmount;
                $alternatives = $budgetValidation['alternatives'] ?? [];
                
                // Get the original budget (source budget for reallocation)
                $originalBudget = \App\Models\RequestBudget::where('fiscal_period_id', $fiscalPeriodId)
                    ->where('status', 'Approved');
                
                if ($rfq->department_id) {
                    $originalBudget->where('department_id', $rfq->department_id);
                }
                if ($rfq->cost_center_id) {
                    $originalBudget->where('cost_center_id', $rfq->cost_center_id);
                }
                if ($rfq->sub_cost_center_id) {
                    $originalBudget->where('sub_cost_center', $rfq->sub_cost_center_id);
                } else {
                    $originalBudget->whereNull('sub_cost_center');
                }
                
                $originalBudget = $originalBudget->first();
                
                if (!$originalBudget) {
                    throw new \Exception('Original budget not found for current subcost center');
                }
                
                // Set PO status to "Pending Reallocation"
                $validatedData['status'] = 'Pending Reallocation';
                
                // Add fiscal period and budget info to purchase order
                $validatedData['fiscal_period_id'] = $fiscalPeriodId;
                $validatedData['request_budget_id'] = $originalBudget->id;
                
                // Store alternative subcost center info (will be used after reallocation is approved)
                $validatedData['alternative_sub_cost_center_id'] = $alternativeSubCostCenterId;
                $validatedData['alternative_budget_amount'] = $shortfallAmount;
                
                \Log::info('PurchaseOrder Store - Creating reallocation request for PO', [
                    'original_budget_id' => $originalBudget->id,
                    'alternative_sub_cost_center_id' => $alternativeSubCostCenterId,
                    'shortfall_amount' => $shortfallAmount,
                    'total_amount' => $totalAmount,
                    'alternatives_count' => count($alternatives)
                ]);
                
                // Note: Reallocation request will be created after PO is created (see below)
            } else {
                // Normal flow - sufficient budget in original subcost center
                // THIS HAPPENS WHEN PO REQUEST IS MADE, NOT AFTER APPROVAL
                $normalBudget = $budgetValidation['budget'];
                $normalReservedBefore = $normalBudget->reserved_amount;
                $normalBalanceBefore = $normalBudget->balance_amount;
                
                \Log::info('=== PO CREATION: RESERVING BUDGET FROM CURRENT SUBCOST CENTER (NORMAL FLOW) ===', [
                    'action' => 'PO_REQUEST_MADE',
                    'stage' => 'BEFORE_RESERVATION',
                    'budget_id' => $normalBudget->id,
                    'sub_cost_center_id' => $normalBudget->sub_cost_center,
                    'reserved_amount_before' => $normalReservedBefore,
                    'balance_amount_before' => $normalBalanceBefore,
                    'po_total_amount' => $totalAmount,
                    'note' => 'This happens when PO request is created, NOT after approval'
                ]);
                
                // Reserve budget with total amount (including VAT)
                $budgetService->reserveBudget($normalBudget, $totalAmount);
                
                // Refresh budget to get updated values
                $normalBudget->refresh();
                
                \Log::info('=== PO CREATION: BUDGET RESERVED FROM CURRENT SUBCOST CENTER (NORMAL FLOW) ===', [
                    'action' => 'PO_REQUEST_MADE',
                    'stage' => 'AFTER_RESERVATION',
                    'budget_id' => $normalBudget->id,
                    'sub_cost_center_id' => $normalBudget->sub_cost_center,
                    'reserved_amount_before' => $normalReservedBefore,
                    'reserved_amount_after' => $normalBudget->reserved_amount,
                    'reserved_amount_increase' => $normalBudget->reserved_amount - $normalReservedBefore,
                    'balance_amount_before' => $normalBalanceBefore,
                    'balance_amount_after' => $normalBudget->balance_amount,
                    'balance_amount_decrease' => $normalBalanceBefore - $normalBudget->balance_amount,
                    'po_total_amount' => $totalAmount,
                    'note' => 'Budget updated when PO request is made - reserved_amount increased, balance_amount decreased'
                ]);
                
                // Log audit
                $normalAuditLogId = DB::table('budget_audit_logs')->insertGetId([
                    'request_budget_id' => $normalBudget->id,
                    'purchase_order_id' => null, // Will be updated after PO is created
                    'action' => 'reserve',
                    'amount' => $totalAmount,
                    'reserved_amount_before' => $normalReservedBefore,
                    'reserved_amount_after' => $normalBudget->reserved_amount,
                    'balance_amount_before' => $normalBalanceBefore,
                    'balance_amount_after' => $normalBudget->balance_amount,
                    'notes' => 'PO created - reserved budget',
                    'created_by' => auth()->id(),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
                
                \Log::info('PurchaseOrder Store - Budget reserved successfully', [
                    'reserved_amount' => $totalAmount,
                    'base_amount' => $baseAmount,
                    'vat_amount' => $vatAmount,
                    'audit_log_id' => $normalAuditLogId
                ]);

                // Add fiscal period and budget info to purchase order
                $validatedData['fiscal_period_id'] = $fiscalPeriodId;
                $validatedData['request_budget_id'] = $normalBudget->id;
            }

            \Log::info('PurchaseOrder Store - Final validated data before creation: ' . json_encode($validatedData));

            // Create purchase order
            \Log::info('=== PO CREATION: CREATING PURCHASE ORDER RECORD ===', [
                'action' => 'PO_REQUEST_MADE',
                'stage' => 'CREATING_PO_RECORD',
                'note' => 'Budget has already been reserved above. Now creating PO record in database.'
            ]);
            
            try {
                $purchaseOrder = PurchaseOrder::create($validatedData);
                \Log::info('=== PO CREATION: PURCHASE ORDER RECORD CREATED ===', [
                    'action' => 'PO_REQUEST_MADE',
                    'stage' => 'PO_RECORD_CREATED',
                    'purchase_order_id' => $purchaseOrder->id,
                    'purchase_order_no' => $purchaseOrder->purchase_order_no,
                    'note' => 'PO record created. Budget was reserved BEFORE this step.'
                ]);
                \Log::info('PurchaseOrder Store - Purchase order created with ID: ' . $purchaseOrder->id);
                
                // Update audit logs with purchase order ID
                if (isset($originalAuditLogId) && $originalAuditLogId) {
                    DB::table('budget_audit_logs')
                        ->where('id', $originalAuditLogId)
                        ->update(['purchase_order_id' => $purchaseOrder->id]);
                }
                if (isset($alternativeAuditLogId) && $alternativeAuditLogId) {
                    DB::table('budget_audit_logs')
                        ->where('id', $alternativeAuditLogId)
                        ->update(['purchase_order_id' => $purchaseOrder->id]);
                }
                if (isset($normalAuditLogId) && $normalAuditLogId) {
                    DB::table('budget_audit_logs')
                        ->where('id', $normalAuditLogId)
                        ->update(['purchase_order_id' => $purchaseOrder->id]);
                }
                
                // If PO status is "Pending Reallocation", create reallocation request
                if ($purchaseOrder->status === 'Pending Reallocation' && isset($alternativeSubCostCenterId) && isset($shortfallAmount)) {
                    \Log::info('PurchaseOrder Store - Creating reallocation request for PO', [
                        'purchase_order_id' => $purchaseOrder->id,
                        'alternative_sub_cost_center_id' => $alternativeSubCostCenterId,
                        'shortfall_amount' => $shortfallAmount
                    ]);
                    
                    // Prepare alternatives data for storage
                    $alternativesData = [];
                    foreach ($alternatives as $alt) {
                        $alternativesData[] = [
                            'sub_cost_center_id' => $alt['sub_cost_center_id'] ?? null,
                            'sub_cost_center_name' => $alt['sub_cost_center_name'] ?? null,
                            'available_amount' => $alt['available_amount'] ?? 0
                        ];
                    }
                    
                    // Create reallocation request
                    $reallocationRequest = RequestBudget::create([
                        'purchase_order_id' => $purchaseOrder->id,
                        'fiscal_period_id' => $fiscalPeriodId,
                        'department_id' => $rfq->department_id,
                        'cost_center_id' => $rfq->cost_center_id,
                        'sub_cost_center' => $rfq->sub_cost_center_id,
                        'reallocate_to_sub_cost_center' => $alternativeSubCostCenterId,
                        'reallocate_amount' => $shortfallAmount,
                        'original_destination_sub_cost_center' => $alternativeSubCostCenterId,
                        'type' => 'reallocation',
                        'status' => 'Draft',
                        'reason_for_increase' => 'Budget reallocation required for Purchase Order: ' . $purchaseOrder->purchase_order_no,
                        'created_by' => auth()->id(),
                        'available_alternatives_json' => json_encode($alternativesData),
                    ]);
                    
                    \Log::info('PurchaseOrder Store - Reallocation request created', [
                        'reallocation_request_id' => $reallocationRequest->id,
                        'purchase_order_id' => $purchaseOrder->id
                    ]);
                    
                    // Get the approval process and create approval transaction and task
                    $process = DB::table('processes')
                        ->where('title', 'Budget Reallocate Approval')
                        ->first();
                    
                    if (!$process) {
                        throw new \Exception('No approval process found for Budget Reallocate Approval');
                    }
                    
                    $processSteps = DB::table('process_steps')
                        ->where('process_id', $process->id)
                        ->orderBy('order')
                        ->get();
                    
                    if ($processSteps->isEmpty()) {
                        throw new \Exception('No approval process steps found for Budget Reallocate Approval');
                    }
                    
                    // Get the first step
                    $processStep = $processSteps->first();
                    
                    // Use ApproverResolver to get the approver
                    $approverResolver = new ApproverResolver();
                    $requester = User::find(auth()->id());
                    $approverId = $approverResolver->resolveApproverId(
                        ProcessStep::find($processStep->id),
                        $requester
                    );
                    
                    if (!$approverId) {
                        throw new \Exception('No assignee found for this process step and user');
                    }
                    
                    // Create budget request transaction
                    DB::table('budget_request_approval_transactions')->insert([
                        'request_budgets_id' => $reallocationRequest->id,
                        'requester_id' => auth()->id(),
                        'assigned_to' => $approverId,
                        'order' => $processStep->order,
                        'description' => $processStep->description,
                        'status' => 'Pending',
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    
                    // Create task
                    DB::table('tasks')->insert([
                        'process_step_id' => $processStep->id,
                        'process_id' => $processStep->process_id,
                        'assigned_at' => now(),
                        'urgency' => 'Normal',
                        'assigned_to_user_id' => $approverId,
                        'assigned_from_user_id' => auth()->id(),
                        'request_budgets_id' => $reallocationRequest->id,
                        'status' => 'Pending',
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    
                    \Log::info('PurchaseOrder Store - Reallocation approval workflow created', [
                        'reallocation_request_id' => $reallocationRequest->id,
                        'task_created' => true
                    ]);
                }
            } catch (\Exception $e) {
                \Log::error('PurchaseOrder Store - Failed to create purchase order: ' . $e->getMessage());
                \Log::error('PurchaseOrder Store - Stack trace: ' . $e->getTraceAsString());
                throw $e;
            }

            // Handle file upload if provided
            if ($request->hasFile('attachment')) {
                $path = $request->file('attachment')->store('purchase-orders','public');
                $purchaseOrder->attachment = $path;
                $purchaseOrder->original_name = $request->file('attachment')->getClientOriginalName();
                $purchaseOrder->save();
            } else {
                // If no new attachment provided, try to copy from quotation document
                if ($request->has('quotation_id')) {
                    $quotation = Quotation::with('documents')->find($request->input('quotation_id'));
                    if ($quotation && $quotation->documents->isNotEmpty()) {
                        $quotationDocument = $quotation->documents->where('type', 'quotation')->first();
                        if ($quotationDocument && $quotationDocument->file_path) {
                            // Copy the file from quotations to purchase-orders directory
                            $sourcePath = storage_path('app/public/' . $quotationDocument->file_path);
                            if (file_exists($sourcePath)) {
                                $fileName = time() . '_' . $quotationDocument->original_name;
                                $destinationPath = 'purchase-orders/' . $fileName;
                                
                                // Copy the file
                                if (Storage::disk('public')->copy($quotationDocument->file_path, $destinationPath)) {
                                    $purchaseOrder->attachment = $destinationPath;
                                    $purchaseOrder->original_name = $quotationDocument->original_name;
                                    $purchaseOrder->save();
                                }
                            }
                        }
                    }
                }
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
                        'alternativeSubCostCenter',
                        'warehouse',
                        'requestBudget',
                        'alternativeRequestBudget',
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
            } else {
                // If no new attachment provided and no existing attachment, try to copy from quotation document
                if (!$purchaseOrder->attachment && $request->has('quotation_id')) {
                    $quotation = Quotation::with('documents')->find($request->input('quotation_id'));
                    if ($quotation && $quotation->documents->isNotEmpty()) {
                        $quotationDocument = $quotation->documents->where('type', 'quotation')->first();
                        if ($quotationDocument && $quotationDocument->file_path) {
                            // Copy the file from quotations to purchase-orders directory
                            $sourcePath = storage_path('app/public/' . $quotationDocument->file_path);
                            if (file_exists($sourcePath)) {
                                $fileName = time() . '_' . $quotationDocument->original_name;
                                $destinationPath = 'purchase-orders/' . $fileName;
                                
                                // Copy the file
                                if (Storage::disk('public')->copy($quotationDocument->file_path, $destinationPath)) {
                                    $purchaseOrder->attachment = $destinationPath;
                                    $purchaseOrder->original_name = $quotationDocument->original_name;
                                    $purchaseOrder->save();
                                }
                            }
                        }
                    }
                }
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
