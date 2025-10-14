<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Grn\StoreGrnRequest;
use App\Http\Requests\V1\Grn\UpdateGrnRequest;
use App\Http\Resources\V1\GrnResource;
use App\Models\Grn;
use App\QueryParameters\GrnParameters;
use App\Services\MaterialRequestAvailabilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class GrnController extends Controller
{
    /**
     * Generate a unique GRN number
     * Format: GRN-YYYY-XXXXX (e.g., GRN-2025-00001)
     */
    private function generateGrnNumber(): string
    {
        $maxAttempts = 10;
        $attempt = 0;
        
        do {
            $attempt++;
            $year = date('Y');
            $lastGrn = Grn::whereYear('created_at', $year)
                ->orderBy('grn_number', 'desc')
                ->first();

            if ($lastGrn) {
                // Extract the numeric part (last 5 digits) and increment
                $lastNumber = (int) substr($lastGrn->grn_number, -5);
                $newNumber = $lastNumber + 1;
            } else {
                $newNumber = 1;
            }

            // Format with leading zeros to maintain 5 digits
            $grnNumber = sprintf("GRN-%s-%05d", $year, $newNumber);
            
            // Check if this number already exists (race condition protection)
            $exists = Grn::where('grn_number', $grnNumber)->exists();
            
            if (!$exists) {
                return $grnNumber;
            }
            
            // If we've tried too many times, use a timestamp-based approach
            if ($attempt >= $maxAttempts) {
                $timestamp = time();
                return sprintf("GRN-%s-%05d", $year, $timestamp % 100000);
            }
            
        } while (true);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $grns = QueryBuilder::for(Grn::class)
            ->allowedFilters(GrnParameters::ALLOWED_FILTERS)
            ->allowedSorts(GrnParameters::ALLOWED_SORTS)
            ->allowedIncludes(GrnParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($grns->isEmpty()) {
            return response()->json([
                'message' => 'No GRNs found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return GrnResource::collection($grns);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreGrnRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            \Log::info('=== GRN STORE REQUEST RECEIVED ===', [
                'raw_request_data' => $request->all(),
                'delivery_status_raw' => $request->input('delivery_status'),
                'delivery_status_type' => gettype($request->input('delivery_status'))
            ]);

            $validated = $request->validated();

            \Log::info('=== GRN STORE REQUEST VALIDATED ===', [
                'validated_data' => $validated,
                'delivery_status_validated' => $validated['delivery_status'] ?? 'NOT_SET',
                'delivery_status_present' => isset($validated['delivery_status'])
            ]);

            // Auto-generate GRN number if not provided
            if (!isset($validated['grn_number'])) {
                $validated['grn_number'] = $this->generateGrnNumber();
            }

            // Set current user as creator if not specified
            if (!isset($validated['user_id'])) {
                $validated['user_id'] = auth()->id();
            }

            // Set GRN status based on delivery_status from request
            if (!isset($validated['status'])) {
                switch ($validated['delivery_status'] ?? 'complete_delivery') {
                    case 'later_delivery':
                        $validated['status'] = 'Partially Delivered';
                        break;
                    case 'adjust_order':
                        $validated['status'] = 'Adjusted Delivery';
                        $validated['task_status'] = 'Draft';
                        break;
                    default:
                        $validated['status'] = 'Fully Delivered';
                        break;
                }
            }

            $grn = Grn::create($validated);

            // Update material request status if GRN is issued against a purchase order
            if ($grn->purchase_order_id) {
                $this->updateMaterialRequestStatusFromGRN($grn);
            }

            // If this is an adjust_order or later_delivery, start the Short Delivery Adjustment Approval process
            \Log::info('=== CHECKING FOR APPROVAL PROCESS TRIGGER ===', [
                'grn_id' => $grn->id,
                'delivery_status_present' => isset($validated['delivery_status']),
                'delivery_status_value' => $validated['delivery_status'] ?? 'NOT_SET',
                'is_adjust_order' => isset($validated['delivery_status']) && $validated['delivery_status'] === 'adjust_order',
                'is_later_delivery' => isset($validated['delivery_status']) && $validated['delivery_status'] === 'later_delivery',
                'should_trigger_approval' => isset($validated['delivery_status']) && in_array($validated['delivery_status'], ['adjust_order', 'later_delivery']),
                'grn_status' => $grn->status,
                'grn_task_status' => $grn->task_status ?? 'NOT_SET'
            ]);

            if (isset($validated['delivery_status']) && in_array($validated['delivery_status'], ['adjust_order', 'later_delivery'])) {
                \Log::info('=== APPROVAL PROCESS TRIGGER DETECTED - STARTING APPROVAL PROCESS ===', [
                    'grn_id' => $grn->id,
                    'grn_number' => $grn->grn_number,
                    'delivery_status' => $validated['delivery_status'],
                    'reason' => 'delivery_status requires approval process'
                ]);
                $this->startShortDeliveryAdjustmentApprovalProcess($grn);
            } else {
                \Log::info('=== APPROVAL PROCESS NOT TRIGGERED ===', [
                    'grn_id' => $grn->id,
                    'delivery_status' => $validated['delivery_status'] ?? 'NOT_SET',
                    'reason' => 'delivery_status does not require approval process',
                    'validated_data' => $validated
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'GRN created successfully',
                'data' => new GrnResource(
                    $grn->load(['user', 'quotation', 'purchaseOrder'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create GRN',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $grn = QueryBuilder::for(Grn::class)
            ->allowedIncludes(GrnParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new GrnResource($grn)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateGrnRequest $request, Grn $grn): JsonResponse
    {
        try {
            DB::beginTransaction();

            \Log::info('=== GRN UPDATE STARTED ===', [
                'grn_id' => $grn->id,
                'grn_number' => $grn->grn_number,
                'old_quantity' => $grn->quantity,
                'old_status' => $grn->status,
                'purchase_order_id' => $grn->purchase_order_id,
                'raw_request_data' => $request->all(),
                'delivery_status_raw' => $request->input('delivery_status'),
                'delivery_status_type' => gettype($request->input('delivery_status'))
            ]);

            $validated = $request->validated();

            \Log::info('=== GRN UPDATE REQUEST VALIDATED ===', [
                'grn_id' => $grn->id,
                'validated_data' => $validated,
                'delivery_status_validated' => $validated['delivery_status'] ?? 'NOT_SET',
                'delivery_status_present' => isset($validated['delivery_status'])
            ]);
            
            // Handle adjust_order and later_delivery cases for updates
            if (isset($validated['delivery_status']) && in_array($validated['delivery_status'], ['adjust_order', 'later_delivery'])) {
                if ($validated['delivery_status'] === 'adjust_order') {
                    $validated['status'] = 'Adjusted Delivery';
                    $validated['task_status'] = 'Draft';
                } elseif ($validated['delivery_status'] === 'later_delivery') {
                    $validated['status'] = 'Partially Delivered';
                    $validated['task_status'] = 'Draft';
                }
                
                \Log::info('=== GRN UPDATE - APPROVAL REQUIRED ROUTE ===', [
                    'grn_id' => $grn->id,
                    'delivery_status' => $validated['delivery_status'],
                    'status' => $validated['status'],
                    'task_status' => $validated['task_status'],
                    'note' => 'Updated existing GRN to require approval'
                ]);
            }

            $grn->update($validated);

            \Log::info('=== GRN UPDATE COMPLETED ===', [
                'grn_id' => $grn->id,
                'new_quantity' => $grn->quantity,
                'new_status' => $grn->status
            ]);

            // If this is an adjust_order or later_delivery, start the Short Delivery Adjustment Approval process
            \Log::info('=== UPDATE: CHECKING FOR APPROVAL PROCESS TRIGGER ===', [
                'grn_id' => $grn->id,
                'delivery_status_present' => isset($validated['delivery_status']),
                'delivery_status_value' => $validated['delivery_status'] ?? 'NOT_SET',
                'is_adjust_order' => isset($validated['delivery_status']) && $validated['delivery_status'] === 'adjust_order',
                'is_later_delivery' => isset($validated['delivery_status']) && $validated['delivery_status'] === 'later_delivery',
                'should_trigger_approval' => isset($validated['delivery_status']) && in_array($validated['delivery_status'], ['adjust_order', 'later_delivery'])
            ]);

            if (isset($validated['delivery_status']) && in_array($validated['delivery_status'], ['adjust_order', 'later_delivery'])) {
                \Log::info('=== UPDATE: APPROVAL PROCESS TRIGGER DETECTED - STARTING APPROVAL PROCESS ===', [
                    'grn_id' => $grn->id,
                    'grn_number' => $grn->grn_number,
                    'delivery_status' => $validated['delivery_status'],
                    'reason' => 'delivery_status requires approval process'
                ]);
                $this->startShortDeliveryAdjustmentApprovalProcess($grn);
            } else {
                \Log::info('=== UPDATE: APPROVAL PROCESS NOT TRIGGERED ===', [
                    'grn_id' => $grn->id,
                    'delivery_status' => $validated['delivery_status'] ?? 'NOT_SET',
                    'reason' => 'delivery_status does not require approval process'
                ]);
            }

            // Note: Material request status update will be triggered after inventory update
            \Log::info('=== GRN UPDATE COMPLETED - MATERIAL REQUEST UPDATE WILL BE TRIGGERED AFTER INVENTORY UPDATE ===', [
                'grn_id' => $grn->id,
                'purchase_order_id' => $grn->purchase_order_id
            ]);

            DB::commit();

            return response()->json([
                'message' => 'GRN updated successfully',
                'data' => new GrnResource(
                    $grn->load(['user', 'quotation', 'purchaseOrder'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('=== GRN UPDATE FAILED ===', [
                'grn_id' => $grn->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to update GRN',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Grn $grn): JsonResponse
    {
        try {
            DB::beginTransaction();

            $grn->delete();

            DB::commit();

            return response()->json([
                'message' => 'GRN deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete GRN',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Check material request availability for testing purposes
     */
    public function checkMaterialRequestAvailability(string $materialRequestId): JsonResponse
    {
        try {
            $materialRequest = \App\Models\MaterialRequest::with(['items.product', 'warehouse'])
                ->findOrFail($materialRequestId);
            
            $availabilityService = new MaterialRequestAvailabilityService();
            $availabilityReport = $availabilityService->getAvailabilityReport($materialRequest);
            
            return response()->json([
                'message' => 'Material request availability check completed',
                'data' => $availabilityReport
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to check material request availability',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update material request status after inventory update
     */
    public function updateMaterialRequestStatus(Grn $grn): JsonResponse
    {
        try {
            \Log::info('=== MANUAL MATERIAL REQUEST STATUS UPDATE TRIGGERED ===', [
                'grn_id' => $grn->id,
                'grn_number' => $grn->grn_number,
                'grn_status' => $grn->status,
                'grn_quantity' => $grn->quantity
            ]);

            // Call the existing material request status update logic
            $this->updateMaterialRequestStatusFromGRN($grn);

            return response()->json([
                'message' => 'Material request status update completed',
                'grn_id' => $grn->id,
                'grn_status' => $grn->status
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            \Log::error('=== FAILED TO UPDATE MATERIAL REQUEST STATUS MANUALLY ===', [
                'grn_id' => $grn->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to update material request status',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }


    /**
     * Update material request status when GRN is issued against a purchase order
     * Only updates to pending if inventory is sufficient to fulfill the request
     */
    private function updateMaterialRequestStatusFromGRN(Grn $grn): void
    {
        try {
            \Log::info('=== MATERIAL REQUEST STATUS UPDATE STARTED ===', [
                'grn_id' => $grn->id,
                'grn_number' => $grn->grn_number,
                'grn_status' => $grn->status,
                'grn_quantity' => $grn->quantity,
                'purchase_order_id' => $grn->purchase_order_id
            ]);

            // Get the purchase order and its related RFQ
            $purchaseOrder = $grn->purchaseOrder()->with('rfq')->first();
            
            if (!$purchaseOrder || !$purchaseOrder->rfq) {
                \Log::warning('=== MATERIAL REQUEST UPDATE FAILED - NO PURCHASE ORDER OR RFQ ===', [
                    'grn_id' => $grn->id,
                    'purchase_order_id' => $grn->purchase_order_id,
                    'purchase_order_exists' => $purchaseOrder ? true : false,
                    'rfq_exists' => $purchaseOrder && $purchaseOrder->rfq ? true : false
                ]);
                return;
            }

            $rfq = $purchaseOrder->rfq;
            
            \Log::info('=== PURCHASE ORDER AND RFQ FOUND ===', [
                'grn_id' => $grn->id,
                'purchase_order_id' => $purchaseOrder->id,
                'rfq_id' => $rfq->id,
                'rfq_number' => $rfq->rfq_number,
                'rfq_department_id' => $rfq->department_id,
                'rfq_cost_center_id' => $rfq->cost_center_id,
                'rfq_sub_cost_center_id' => $rfq->sub_cost_center_id,
                'rfq_warehouse_id' => $rfq->warehouse_id
            ]);

            // Find material requests that match this RFQ's details
            // Only look for material requests that are still in "Referred" status (status_id = 2)
            // Don't update material requests that have already been issued (status_id = 51) or approved (status_id = 4)
            
            $query = \App\Models\MaterialRequest::where('status_id', 2); // Only Referred status
            
            if ($rfq->department_id) {
                $query->where('department_id', $rfq->department_id);
            }
            if ($rfq->cost_center_id) {
                $query->where('cost_center_id', $rfq->cost_center_id);
            }
            if ($rfq->sub_cost_center_id) {
                $query->where('sub_cost_center_id', $rfq->sub_cost_center_id);
            }
            if ($rfq->warehouse_id) {
                $query->where('warehouse_id', $rfq->warehouse_id);
            }
            
            $materialRequests = $query->with(['items.product', 'warehouse'])->get();
            
            \Log::info('=== MATERIAL REQUEST SEARCH CRITERIA ===', [
                'grn_id' => $grn->id,
                'rfq_id' => $rfq->id,
                'search_criteria' => [
                    'status_id' => 2, // Only Referred
                    'department_id' => $rfq->department_id,
                    'cost_center_id' => $rfq->cost_center_id,
                    'sub_cost_center_id' => $rfq->sub_cost_center_id,
                    'warehouse_id' => $rfq->warehouse_id
                ],
                'note' => 'Only searching for material requests in Referred status (status_id = 2)'
            ]);

            \Log::info('=== MATERIAL REQUEST SEARCH RESULTS ===', [
                'grn_id' => $grn->id,
                'rfq_id' => $rfq->id,
                'matching_requests_count' => $materialRequests->count(),
                'search_criteria' => [
                    'department_id' => $rfq->department_id,
                    'cost_center_id' => $rfq->cost_center_id,
                    'sub_cost_center_id' => $rfq->sub_cost_center_id,
                    'warehouse_id' => $rfq->warehouse_id
                ],
                'material_requests' => $materialRequests->map(function($mr) {
                    return [
                        'id' => $mr->id,
                        'status_id' => $mr->status_id,
                        'warehouse_id' => $mr->warehouse_id,
                        'items_count' => $mr->items->count()
                    ];
                })->toArray()
            ]);

            $availabilityService = new MaterialRequestAvailabilityService();

            foreach ($materialRequests as $materialRequest) {
                \Log::info('=== PROCESSING MATERIAL REQUEST ===', [
                    'grn_id' => $grn->id,
                    'material_request_id' => $materialRequest->id,
                    'current_status_id' => $materialRequest->status_id,
                    'warehouse_id' => $materialRequest->warehouse_id,
                    'items_count' => $materialRequest->items->count()
                ]);

                // Always check if we can fulfill the request with current inventory
                $canFulfill = $availabilityService->canSetToPending($materialRequest);
                
                \Log::info('=== INVENTORY AVAILABILITY CHECK ===', [
                    'grn_id' => $grn->id,
                    'material_request_id' => $materialRequest->id,
                    'can_fulfill' => $canFulfill
                ]);
                
                if ($canFulfill) {
                    // Update material request status to Pending (status_id = 1) - ready for material issue
                    $materialRequest->update([
                        'status_id' => 1, // Pending status
                        'updated_at' => now()
                    ]);

                    \Log::info('=== MATERIAL REQUEST STATUS UPDATED TO PENDING ===', [
                        'grn_id' => $grn->id,
                        'material_request_id' => $materialRequest->id,
                        'old_status_id' => 2, // Referred
                        'new_status_id' => 1, // Pending
                        'rfq_id' => $rfq->id,
                        'grn_status' => $grn->status,
                        'reason' => 'Sufficient inventory available to fulfill material request'
                    ]);
                } else {
                    // Get detailed availability report
                    $availabilityReport = $availabilityService->getAvailabilityReport($materialRequest);
                    
                    \Log::warning('=== MATERIAL REQUEST STATUS NOT UPDATED - INSUFFICIENT INVENTORY ===', [
                        'grn_id' => $grn->id,
                        'material_request_id' => $materialRequest->id,
                        'rfq_id' => $rfq->id,
                        'grn_status' => $grn->status,
                        'availability_report' => $availabilityReport,
                        'reason' => 'Insufficient inventory to fulfill material request - keeping in referred status'
                    ]);
                }
            }

            if ($materialRequests->isEmpty()) {
                \Log::warning('GRN Status Update: No matching material requests found', [
                    'grn_id' => $grn->id,
                    'rfq_id' => $rfq->id,
                    'search_criteria' => [
                        'department_id' => $rfq->department_id,
                        'cost_center_id' => $rfq->cost_center_id,
                        'sub_cost_center_id' => $rfq->sub_cost_center_id,
                        'warehouse_id' => $rfq->warehouse_id
                    ]
                ]);
            }

        } catch (\Exception $e) {
            \Log::error('GRN Status Update: Failed to update material request status', [
                'grn_id' => $grn->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * Start the Short Delivery Adjustment Approval process for a GRN
     */
    private function startShortDeliveryAdjustmentApprovalProcess(Grn $grn): void
    {
        try {
            \Log::info('=== STARTING SHORT DELIVERY ADJUSTMENT APPROVAL PROCESS ===', [
                'grn_id' => $grn->id,
                'grn_number' => $grn->grn_number,
                'requester_id' => $grn->user_id
            ]);

            // Check if approval process is already started for this GRN
            $existingTransaction = DB::table('grn_approval_transactions')
                ->where('grn_id', $grn->id)
                ->first();

            \Log::info('=== CHECKING FOR EXISTING APPROVAL TRANSACTIONS ===', [
                'grn_id' => $grn->id,
                'existing_transaction_found' => $existingTransaction ? true : false,
                'existing_transaction_id' => $existingTransaction ? $existingTransaction->id : null
            ]);

            if ($existingTransaction) {
                \Log::info('=== SHORT DELIVERY ADJUSTMENT APPROVAL PROCESS ALREADY STARTED ===', [
                    'grn_id' => $grn->id,
                    'existing_transaction_id' => $existingTransaction->id,
                    'reason' => 'Approval process already exists for this GRN'
                ]);
                return;
            }

            // Get the Short Delivery Adjustment Approval process
            $process = DB::table('processes')
                ->where('title', 'Short Delivery Adjustment Approval')
                ->where('status', 'Active')
                ->first();

            \Log::info('=== SEARCHING FOR SHORT DELIVERY ADJUSTMENT APPROVAL PROCESS ===', [
                'grn_id' => $grn->id,
                'process_found' => $process ? true : false,
                'process_id' => $process ? $process->id : null,
                'process_title' => $process ? $process->title : null,
                'process_status' => $process ? $process->status : null,
                'all_processes' => DB::table('processes')->where('title', 'LIKE', '%Short Delivery%')->get(['id', 'title', 'status'])
            ]);

            if (!$process) {
                \Log::error('=== SHORT DELIVERY ADJUSTMENT APPROVAL PROCESS NOT FOUND ===', [
                    'grn_id' => $grn->id,
                    'reason' => 'Process with title "Short Delivery Adjustment Approval" and status "Active" not found in database'
                ]);
                return;
            }

            // Get the first step of the process
            $firstStep = DB::table('process_steps')
                ->where('process_id', $process->id)
                ->orderBy('order')
                ->first();

            \Log::info('=== SEARCHING FOR PROCESS STEPS ===', [
                'grn_id' => $grn->id,
                'process_id' => $process->id,
                'first_step_found' => $firstStep ? true : false,
                'first_step_id' => $firstStep ? $firstStep->id : null,
                'first_step_order' => $firstStep ? $firstStep->order : null,
                'first_step_description' => $firstStep ? $firstStep->description : null
            ]);

            if (!$firstStep) {
                \Log::error('=== NO PROCESS STEPS FOUND FOR SHORT DELIVERY ADJUSTMENT APPROVAL ===', [
                    'grn_id' => $grn->id,
                    'process_id' => $process->id,
                    'reason' => 'No process steps found for the Short Delivery Adjustment Approval process'
                ]);
                return;
            }

            \Log::info('=== PROCESS AND FIRST STEP FOUND ===', [
                'grn_id' => $grn->id,
                'process_id' => $process->id,
                'process_title' => $process->title,
                'first_step_id' => $firstStep->id,
                'first_step_order' => $firstStep->order,
                'first_step_description' => $firstStep->description
            ]);

            // Get the approver for the first step
            $resolver = new \App\Services\ApproverResolver();
            $eloquentStep = \App\Models\ProcessStep::find($firstStep->id);
            $requester = \App\Models\User::find($grn->user_id);

            if (!$eloquentStep || !$requester) {
                \Log::error('=== FAILED TO RESOLVE APPROVER - MISSING STEP OR REQUESTER ===', [
                    'grn_id' => $grn->id,
                    'eloquent_step_found' => $eloquentStep ? true : false,
                    'requester_found' => $requester ? true : false
                ]);
                return;
            }

            $approverId = $resolver->resolveApproverId($eloquentStep, $requester);

            if (!$approverId) {
                \Log::error('=== FAILED TO RESOLVE APPROVER ===', [
                    'grn_id' => $grn->id,
                    'step_id' => $firstStep->id,
                    'requester_id' => $grn->user_id
                ]);
                return;
            }

            \Log::info('=== APPROVER RESOLVED ===', [
                'grn_id' => $grn->id,
                'approver_id' => $approverId,
                'step_id' => $firstStep->id
            ]);

            // Create the approval transaction
            $approvalTransactionId = DB::table('grn_approval_transactions')->insertGetId([
                'grn_id' => $grn->id,
                'requester_id' => $grn->user_id,
                'assigned_to' => $approverId,
                'order' => $firstStep->order,
                'description' => $firstStep->description,
                'status' => 'Pending',
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
                'created_at' => now(),
                'updated_at' => now()
            ]);

            \Log::info('=== CREATED GRN APPROVAL TRANSACTION ===', [
                'grn_id' => $grn->id,
                'approval_transaction_id' => $approvalTransactionId,
                'approver_id' => $approverId,
                'step_order' => $firstStep->order
            ]);

            // Create the task
            $taskId = DB::table('tasks')->insertGetId([
                'process_step_id' => $firstStep->id,
                'process_id' => $process->id,
                'assigned_at' => now(),
                'urgency' => 'Normal',
                'order_no' => $firstStep->order,
                'assigned_to_user_id' => $approverId,
                'assigned_from_user_id' => $grn->user_id,
                'read_status' => null,
                'grn_id' => $grn->id,
                'created_at' => now(),
                'updated_at' => now()
            ]);

            \Log::info('=== CREATED GRN APPROVAL TASK ===', [
                'grn_id' => $grn->id,
                'task_id' => $taskId,
                'approver_id' => $approverId,
                'step_order' => $firstStep->order
            ]);

            // Send task assignment notification
            $task = \App\Models\Task::with(['assignedToUser', 'process'])->find($taskId);
            if ($task) {
                $task->assignedToUser->notify(new \App\Notifications\TaskAssignmentNotification($task, 'Short Delivery Adjustment Approval'));
                \Log::info('=== TASK ASSIGNMENT NOTIFICATION SENT ===', [
                    'grn_id' => $grn->id,
                    'task_id' => $taskId,
                    'approver_id' => $approverId,
                    'task_type' => 'Short Delivery Adjustment Approval'
                ]);
            }

        } catch (\Exception $e) {
            \Log::error('=== FAILED TO START SHORT DELIVERY ADJUSTMENT APPROVAL PROCESS ===', [
                'grn_id' => $grn->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }
}
