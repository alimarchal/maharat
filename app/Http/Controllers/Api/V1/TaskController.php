<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Task\StoreTaskRequest;
use App\Http\Requests\V1\Task\UpdateTaskRequest;
use App\Http\Resources\V1\TaskResource;
use App\Http\Resources\V1\TaskCollection;
use App\Models\Task;
use App\Models\TaskDescription;
use App\QueryParameters\TaskParameters;
use App\Services\TransactionFlowService;
use App\Services\TaskNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class TaskController extends Controller
{
    public function index(): JsonResponse
    {
        $perPage = request()->get('per_page', 15);
        
        $tasks = QueryBuilder::for(Task::class)
            ->allowedFilters(TaskParameters::getAllFilters())
            ->allowedSorts(TaskParameters::ALLOWED_SORTS)
            ->allowedIncludes(TaskParameters::ALLOWED_INCLUDES)
            ->paginate($perPage)
            ->appends(request()->query());

        if ($tasks->isEmpty()) {
            return response()->json([
                'message' => 'No tasks found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return response()->json(new TaskCollection($tasks), Response::HTTP_OK);
    }

    public function store(StoreTaskRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $task = Task::create($request->safe()->except('descriptions'));

            // Create task descriptions if provided
            if ($request->has('descriptions')) {
                foreach ($request->input('descriptions') as $description) {
                    $task->descriptions()->create($description);
                }
            }

            // Send task assignment notification
            $task->load(['assignedToUser', 'process']);
            if ($task->assignedToUser && $task->process) {
                $notificationService = new TaskNotificationService();
                $taskType = $notificationService->getTaskTypeFromProcess($task->process->title);
                $notificationService->sendTaskAssignmentNotification($task, $taskType);
            }

            DB::commit();

            return response()->json([
                'message' => 'Task created successfully',
                'data' => new TaskResource($task->load([
                    'processStep',
                    'process',
                    'assignedFromUser',
                    'assignedToUser',
                    'descriptions',
                    'material_request',
                    'rfq',
                    'purchase_order',
                    'payment_order',
                    'invoice',
                    'budget',
                    'budget_approval_transaction',
                    'request_budget',
                ]))
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create task',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $task = QueryBuilder::for(Task::class)
            ->allowedIncludes(TaskParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new TaskResource($task)
        ], Response::HTTP_OK);
    }

    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        try {
            Log::info('=== TASK CONTROLLER UPDATE METHOD CALLED ===', [
                'task_id' => $task->id,
                'material_request_id' => $task->material_request_id,
                'request_status' => $request->input('status'),
                'current_task_status' => $task->status,
                'order_no' => $task->order_no,
                'process_step_id' => $task->process_step_id
            ]);
            
            DB::beginTransaction();

            // ============================================================
            // CHECK IF THIS IS A REFERRED TASK RESPONSE **BEFORE** UPDATING
            // ============================================================
            // Only consider it a referral response if:
            // 1. It has assigned_from_user_id (was created as a result of a referral)
            // 2. It has continue_approval_flow = false (should not continue normal flow)
            // 3. The status is Approved or Rejected
            
            Log::info('=== CHECKING REFERRAL RESPONSE CONDITIONS ===', [
                'task_id' => $task->id,
                'assigned_from_user_id' => $task->assigned_from_user_id,
                'continue_approval_flow' => $task->continue_approval_flow,
                'continue_approval_flow_type' => gettype($task->continue_approval_flow),
                'continue_approval_flow_false_check' => $task->continue_approval_flow == false,
                'continue_approval_flow_zero_check' => $task->continue_approval_flow == 0,
                'request_status' => $request->input('status'),
                'is_approved_or_rejected' => in_array($request->input('status'), ['Approved', 'Rejected'])
            ]);
            
            if ($task->assigned_from_user_id && 
                $task->continue_approval_flow == false &&
                in_array($request->input('status'), ['Approved', 'Rejected'])) {
                
                Log::info('=== REFERRAL RESPONSE TASK DETECTED ===', [
                    'task_id' => $task->id,
                    'assigned_from_user_id' => $task->assigned_from_user_id,
                    'assigned_to_user_id' => $task->assigned_to_user_id,
                    'status' => $request->input('status'),
                    'material_request_id' => $task->material_request_id,
                    'rfq_id' => $task->rfq_id,
                    'purchase_order_id' => $task->purchase_order_id,
                    'payment_order_id' => $task->payment_order_id,
                    'invoice_id' => $task->invoice_id,
                    'budget_id' => $task->budget_id,
                    'request_budgets_id' => $task->request_budgets_id,
                    'grn_id' => $task->grn_id
                ]);
                
                // Find the original task that was referred
                $originalTask = Task::where('status', 'Referred')
                    ->where('assigned_to_user_id', $task->assigned_from_user_id)
                    ->where('order_no', $task->order_no)
                    ->where('process_step_id', $task->process_step_id)
                    ->where(function($query) use ($task) {
                        if ($task->material_request_id) {
                            $query->where('material_request_id', $task->material_request_id);
                        } elseif ($task->rfq_id) {
                            $query->where('rfq_id', $task->rfq_id);
                        } elseif ($task->purchase_order_id) {
                            $query->where('purchase_order_id', $task->purchase_order_id);
                        } elseif ($task->payment_order_id) {
                            $query->where('payment_order_id', $task->payment_order_id);
                        } elseif ($task->invoice_id) {
                            $query->where('invoice_id', $task->invoice_id);
                        } elseif ($task->budget_id) {
                            $query->where('budget_id', $task->budget_id);
                        } elseif ($task->request_budgets_id) {
                            $query->where('request_budgets_id', $task->request_budgets_id);
                        } elseif ($task->grn_id) {
                            $query->where('grn_id', $task->grn_id);
                        }
                    })
                    ->first();

                if ($originalTask) {
                    Log::info('=== ORIGINAL TASK FOUND FOR REFERRAL RESPONSE ===', [
                        'original_task_id' => $originalTask->id,
                        'original_assigned_to_user_id' => $originalTask->assigned_to_user_id,
                        'original_order_no' => $originalTask->order_no,
                        'original_process_step_id' => $originalTask->process_step_id
                    ]);
                    
                    // Update the referred user's task with their decision (Approved/Rejected)
                    $task->update($request->validated());

                    // Update referred user's task descriptions
                    if ($request->has('descriptions')) {
                        foreach ($request->input('descriptions') as $description) {
                            TaskDescription::create([
                                'task_id' => $task->id,
                                'description' => $description['description'] ?? '',
                                'action' => $request->input('status') === 'Approved' ? 'Approve' : 'Reject',
                                'user_id' => $task->assigned_to_user_id
                            ]);
                        }
                    }

                    // CREATE A NEW TASK for the original approver
                    Log::info('=== CREATING NEW TASK FOR ORIGINAL APPROVER ===', [
                        'original_task_id' => $originalTask->id,
                        'new_task_assigned_to' => $originalTask->assigned_to_user_id,
                        'new_task_assigned_from' => $task->assigned_to_user_id,
                        'referral_response_status' => $request->input('status')
                    ]);
                    
                    $newTaskForOriginalApprover = Task::create([
                        'process_step_id' => $originalTask->process_step_id,
                        'process_id' => $originalTask->process_id,
                        'assigned_at' => now(),
                        'urgency' => $originalTask->urgency,
                        'order_no' => $originalTask->order_no,
                        'assigned_from_user_id' => $task->assigned_to_user_id, // From referred user
                        'assigned_to_user_id' => $originalTask->assigned_to_user_id, // To original approver
                        'continue_approval_flow' => true, // This task SHOULD continue normal approval flow
                        'material_request_id' => $originalTask->material_request_id,
                        'rfq_id' => $originalTask->rfq_id,
                        'purchase_order_id' => $originalTask->purchase_order_id,
                        'payment_order_id' => $originalTask->payment_order_id,
                        'invoice_id' => $originalTask->invoice_id,
                        'budget_id' => $originalTask->budget_id,
                        'budget_approval_transaction_id' => $originalTask->budget_approval_transaction_id,
                        'request_budgets_id' => $originalTask->request_budgets_id,
                        'grn_id' => $originalTask->grn_id,
                        'status' => 'Pending',
                        'read_status' => null
                    ]);

                    Log::info('=== NEW TASK FOR ORIGINAL APPROVER CREATED ===', [
                        'original_task_id' => $originalTask->id,
                        'new_task_id' => $newTaskForOriginalApprover->id,
                        'referral_response_task_id' => $task->id,
                        'assigned_from_user_id' => $newTaskForOriginalApprover->assigned_from_user_id,
                        'assigned_to_user_id' => $newTaskForOriginalApprover->assigned_to_user_id,
                        'continue_approval_flow' => $newTaskForOriginalApprover->continue_approval_flow,
                        'referral_response_status' => $request->input('status')
                    ]);

                    // Copy all task descriptions from original task to the new task
                    foreach ($originalTask->descriptions as $desc) {
                        TaskDescription::create([
                            'task_id' => $newTaskForOriginalApprover->id,
                            'description' => $desc->description,
                            'action' => $desc->action,
                            'user_id' => $desc->user_id
                        ]);
                    }

                    // Add the referred user's response as a description to the new task
                    $referredUserName = $task->assignedToUser->name ?? 'Referred User';
                    $referredUserComment = $request->input('descriptions.0.description') ?? 'No comment provided';
                    
                    Log::info('=== ADDING REFERRAL RESPONSE DESCRIPTION ===', [
                        'new_task_id' => $newTaskForOriginalApprover->id,
                        'referred_user_name' => $referredUserName,
                        'referred_user_comment' => $referredUserComment,
                        'referral_response_status' => $request->input('status')
                    ]);
                    
                    TaskDescription::create([
                        'task_id' => $newTaskForOriginalApprover->id,
                        'description' => $referredUserComment, // Use the actual comment, not the username
                        'action' => $request->input('status') === 'Approved' ? 'Approve' : 'Reject',
                        'user_id' => $task->assigned_to_user_id
                    ]);

                    // Update the referee's transaction with their actual response
                    Log::info('=== LOOKING FOR REFEREE TRANSACTION (MATERIAL REQUEST) ===', [
                        'task_id' => $task->id,
                        'material_request_id' => $task->material_request_id,
                        'referee_user_id' => $task->assigned_to_user_id,
                        'referee_response' => $request->input('status')
                    ]);
                    
                    $refereeTransaction = DB::table('material_request_transactions')
                        ->where('material_request_id', $task->material_request_id)
                        ->where('assigned_to', $task->assigned_to_user_id)
                        ->where('created_at', '>=', now()->subMinutes(5)) // Recent transaction
                        ->first();
                    
                    Log::info('=== REFEREE TRANSACTION SEARCH RESULT (MATERIAL REQUEST) ===', [
                        'task_id' => $task->id,
                        'referee_transaction_found' => $refereeTransaction ? true : false,
                        'referee_transaction_id' => $refereeTransaction ? $refereeTransaction->id : null,
                        'referee_transaction_status' => $refereeTransaction ? $refereeTransaction->status : null
                    ]);
                    
                    if ($refereeTransaction) {
                        $newStatus = $request->input('status') === 'Approved' ? 'Approve' : 'Reject';
                        $updateResult = DB::table('material_request_transactions')
                            ->where('id', $refereeTransaction->id)
                            ->update([
                                'status' => $newStatus,
                                'updated_at' => now()
                            ]);
                        
                        Log::info('=== REFEREE TRANSACTION UPDATE RESULT (MATERIAL REQUEST) ===', [
                            'task_id' => $task->id,
                            'referee_transaction_id' => $refereeTransaction->id,
                            'new_status' => $newStatus,
                            'update_success' => $updateResult > 0,
                            'rows_affected' => $updateResult
                        ]);
                    } else {
                        Log::info('=== REFEREE TRANSACTION NOT FOUND - THIS IS EXPECTED ===', [
                            'task_id' => $task->id,
                            'material_request_id' => $task->material_request_id,
                            'referee_user_id' => $task->assigned_to_user_id,
                            'note' => 'Referee transactions are not created separately - status is stored in referrer transaction'
                        ]);
                    }

                    // Update the approval transaction back to Pending and clear referral
                    if ($task->material_request_id) {
                        Log::info('=== UPDATING MATERIAL REQUEST TRANSACTION FOR REFERRAL RESPONSE ===', [
                            'task_id' => $task->id,
                            'material_request_id' => $task->material_request_id,
                            'original_task_id' => $originalTask->id,
                            'original_assigned_to' => $originalTask->assigned_to_user_id,
                            'referred_to_user_id' => $task->assigned_to_user_id
                        ]);
                        
                        $updateResult = DB::table('material_request_transactions')
                            ->where('material_request_id', $task->material_request_id)
                            ->where('assigned_to', $originalTask->assigned_to_user_id)
                            ->where('referred_to', $task->assigned_to_user_id)
                            ->update([
                                'status' => 'Refer', // Keep as Refer to show referral status
                                // Keep referred_to to maintain referee information
                                'updated_at' => now()
                            ]);
                            
                        Log::info('=== MATERIAL REQUEST TRANSACTION UPDATE RESULT ===', [
                            'task_id' => $task->id,
                            'material_request_id' => $task->material_request_id,
                            'update_result' => $updateResult,
                            'rows_affected' => $updateResult
                        ]);
                        
                        // Now call the Material Request Approval Transaction Controller to handle the approval flow
                        Log::info('=== CALLING MATERIAL REQUEST APPROVAL TRANSACTION CONTROLLER FOR REFERRAL RESPONSE ===', [
                            'task_id' => $task->id,
                            'material_request_id' => $task->material_request_id,
                            'original_assigned_to' => $originalTask->assigned_to_user_id
                        ]);
                        
                        $approvalTransaction = DB::table('material_request_transactions')
                            ->where('material_request_id', $task->material_request_id)
                            ->where('assigned_to', $originalTask->assigned_to_user_id)
                            ->first();
                            
                        if ($approvalTransaction) {
                            Log::info('=== FOUND APPROVAL TRANSACTION FOR CONTROLLER CALL ===', [
                                'approval_transaction_id' => $approvalTransaction->id,
                                'material_request_id' => $task->material_request_id,
                                'assigned_to' => $approvalTransaction->assigned_to,
                                'current_status' => $approvalTransaction->status
                            ]);
                            
                        // Update the transaction directly instead of calling the controller
                        // This avoids the FormRequest validation issue and prevents next approval creation
                        $updateResult = DB::table('material_request_transactions')
                            ->where('id', $approvalTransaction->id)
                            ->update([
                                'status' => 'Pending', // Change to Pending when referee responds
                                'updated_at' => now()
                            ]);
                        
                        Log::info('=== MATERIAL REQUEST TRANSACTION UPDATED DIRECTLY FOR REFERRAL RESPONSE ===', [
                            'task_id' => $task->id,
                            'material_request_id' => $task->material_request_id,
                            'transaction_id' => $approvalTransaction->id,
                            'new_status' => 'Approve',
                            'update_result' => $updateResult
                        ]);
                        
                        // DO NOT trigger approval flow logic - this prevents creating next approval task
                        Log::info('=== SKIPPING APPROVAL FLOW TRIGGER FOR REFERRAL RESPONSE ===', [
                            'material_request_id' => $task->material_request_id,
                            'transaction_id' => $approvalTransaction->id,
                            'reason' => 'referral_response_handled'
                        ]);
                        
                        // Set continue_approval_flow = true on the original task when referrer approves
                        $oldOriginalValue = $originalTask->continue_approval_flow;
                        $originalTask->update(['continue_approval_flow' => true]);
                        Log::info('=== REFERRER APPROVED - SETTING continue_approval_flow = true ON ORIGINAL TASK ===', [
                            'original_task_id' => $originalTask->id,
                            'referral_response_task_id' => $task->id,
                            'referral_response_status' => $request->input('status'),
                            'old_continue_approval_flow' => $oldOriginalValue,
                            'new_continue_approval_flow' => true,
                            'original_assigned_to_user_id' => $originalTask->assigned_to_user_id,
                            'referral_response_assigned_to_user_id' => $task->assigned_to_user_id
                        ]);
                        
                        // REFERRAL RESPONSES SHOULD NEVER SET STATUS TO APPROVED
                        // A referral response is just providing input to the original approver
                        // The original approver still needs to make the final decision
                        // Therefore, referral responses should NEVER be treated as final approvals
                        
                        $isFinalApproval = false; // Referral responses are NEVER final approvals
                        
                        Log::info('=== MATERIAL REQUEST FINAL APPROVAL CHECK FOR REFERRAL RESPONSE ===', [
                            'task_id' => $task->id,
                            'material_request_id' => $task->material_request_id,
                            'original_task_process_step_id' => $originalTask->process_step_id,
                            'original_task_step_order' => DB::table('process_steps')->where('id', $originalTask->process_step_id)->value('order'),
                            'original_task_order_no' => $originalTask->order_no,
                            'is_final_approval' => $isFinalApproval,
                            'note' => 'Referral responses are NEVER final approvals - only original approver can set status to Approved'
                        ]);
                        
                        if ($isFinalApproval) {
                            Log::info('=== FINAL MATERIAL REQUEST APPROVAL - UPDATING STATUS ===', [
                                'task_id' => $task->id,
                                'material_request_id' => $task->material_request_id,
                                'current_status_id' => DB::table('material_requests')->where('id', $task->material_request_id)->value('status_id'),
                                'target_status_id' => 4 // Approved
                            ]);
                            
                            // Update Material Request status to Approved
                            $materialRequestUpdated = DB::table('material_requests')
                                ->where('id', $task->material_request_id)
                                ->update([
                                    'status_id' => 4, // Approved
                                    'updated_at' => now()
                                ]);
                            
                            Log::info('=== MATERIAL REQUEST STATUS UPDATE RESULT ===', [
                                'task_id' => $task->id,
                                'material_request_id' => $task->material_request_id,
                                'update_success' => $materialRequestUpdated,
                                'new_status_id' => DB::table('material_requests')->where('id', $task->material_request_id)->value('status_id')
                            ]);
                        }
                        } else {
                            Log::error('=== NO APPROVAL TRANSACTION FOUND FOR CONTROLLER CALL ===', [
                                'material_request_id' => $task->material_request_id,
                                'assigned_to' => $originalTask->assigned_to_user_id
                            ]);
                        }
                    } elseif ($task->rfq_id) {
                        // Update the referee's transaction with their actual response
                        $refereeTransaction = DB::table('rfq_approval_transactions')
                            ->where('rfq_id', $task->rfq_id)
                            ->where('assigned_to', $task->assigned_to_user_id)
                            ->where('created_at', '>=', now()->subMinutes(5)) // Recent transaction
                            ->first();
                        
                        if ($refereeTransaction) {
                            DB::table('rfq_approval_transactions')
                                ->where('id', $refereeTransaction->id)
                                ->update([
                                    'status' => $request->input('status') === 'Approved' ? 'Approve' : 'Reject',
                                    'updated_at' => now()
                                ]);
                        }

                        // Update the referrer's transaction to Pending when referee responds
                        $updateResult = DB::table('rfq_approval_transactions')
                            ->where('rfq_id', $task->rfq_id)
                            ->where('assigned_to', $originalTask->assigned_to_user_id)
                            ->where('referred_to', $task->assigned_to_user_id)
                            ->update([
                                'status' => 'Pending', // Change to Pending when referee responds
                                'updated_at' => now()
                            ]);
                        
                        Log::info('=== RFQ TRANSACTION UPDATE RESULT FOR REFERRAL RESPONSE ===', [
                            'task_id' => $task->id,
                            'rfq_id' => $task->rfq_id,
                            'update_result' => $updateResult,
                            'rows_affected' => $updateResult
                        ]);
                    } elseif ($task->purchase_order_id) {
                        // Update the referee's transaction with their actual response
                        $refereeTransaction = DB::table('po_approval_transactions')
                            ->where('purchase_order_id', $task->purchase_order_id)
                            ->where('assigned_to', $task->assigned_to_user_id)
                            ->where('created_at', '>=', now()->subMinutes(5)) // Recent transaction
                            ->first();
                        
                        if ($refereeTransaction) {
                            DB::table('po_approval_transactions')
                                ->where('id', $refereeTransaction->id)
                                ->update([
                                    'status' => $request->input('status') === 'Approved' ? 'Approve' : 'Reject',
                                    'updated_at' => now()
                                ]);
                        }

                        DB::table('po_approval_transactions')
                            ->where('purchase_order_id', $task->purchase_order_id)
                            ->where('assigned_to', $originalTask->assigned_to_user_id)
                            ->where('referred_to', $task->assigned_to_user_id)
                            ->update([
                                'status' => 'Pending', // Change to Pending when referee responds
                                'updated_at' => now()
                            ]);
                    } elseif ($task->invoice_id) {
                        // Update the referee's transaction with their actual response
                        $refereeTransaction = DB::table('mahrat_invoice_approval_transactions')
                            ->where('invoice_id', $task->invoice_id)
                            ->where('assigned_to', $task->assigned_to_user_id)
                            ->where('created_at', '>=', now()->subMinutes(5)) // Recent transaction
                            ->first();
                        
                        if ($refereeTransaction) {
                            DB::table('mahrat_invoice_approval_transactions')
                                ->where('id', $refereeTransaction->id)
                                ->update([
                                    'status' => $request->input('status') === 'Approved' ? 'Approve' : 'Reject',
                                    'updated_at' => now()
                                ]);
                        }

                        DB::table('mahrat_invoice_approval_transactions')
                            ->where('invoice_id', $task->invoice_id)
                            ->where('assigned_to', $originalTask->assigned_to_user_id)
                            ->where('referred_to', $task->assigned_to_user_id)
                            ->update([
                                'status' => 'Pending', // Change to Pending when referee responds
                                'updated_at' => now()
                            ]);
                    } elseif ($task->budget_id) {
                        // Update the referee's transaction with their actual response
                        $refereeTransaction = DB::table('budget_approval_transactions')
                            ->where('budget_id', $task->budget_id)
                            ->where('assigned_to', $task->assigned_to_user_id)
                            ->where('created_at', '>=', now()->subMinutes(5)) // Recent transaction
                            ->first();
                        
                        if ($refereeTransaction) {
                            DB::table('budget_approval_transactions')
                                ->where('id', $refereeTransaction->id)
                                ->update([
                                    'status' => $request->input('status') === 'Approved' ? 'Approve' : 'Reject',
                                    'updated_at' => now()
                                ]);
                        }

                        DB::table('budget_approval_transactions')
                            ->where('budget_id', $task->budget_id)
                            ->where('assigned_to', $originalTask->assigned_to_user_id)
                            ->where('referred_to', $task->assigned_to_user_id)
                            ->update([
                                'status' => 'Pending', // Change to Pending when referee responds
                                'updated_at' => now()
                            ]);
                    } elseif ($task->request_budgets_id) {
                        // Update the referee's transaction with their actual response
                        $refereeTransaction = DB::table('budget_request_approval_transactions')
                            ->where('request_budgets_id', $task->request_budgets_id)
                            ->where('assigned_to', $task->assigned_to_user_id)
                            ->where('created_at', '>=', now()->subMinutes(5)) // Recent transaction
                            ->first();
                        
                        if ($refereeTransaction) {
                            DB::table('budget_request_approval_transactions')
                                ->where('id', $refereeTransaction->id)
                                ->update([
                                    'status' => $request->input('status') === 'Approved' ? 'Approve' : 'Reject',
                                    'updated_at' => now()
                                ]);
                        }

                        DB::table('budget_request_approval_transactions')
                            ->where('request_budgets_id', $task->request_budgets_id)
                            ->where('assigned_to', $originalTask->assigned_to_user_id)
                            ->where('referred_to', $task->assigned_to_user_id)
                            ->update([
                                'status' => 'Pending', // Change to Pending when referee responds
                                'updated_at' => now()
                            ]);
                    } elseif ($task->payment_order_id) {
                        // Update the referee's transaction with their actual response
                        Log::info('=== LOOKING FOR REFEREE TRANSACTION (PAYMENT ORDER) ===', [
                            'task_id' => $task->id,
                            'payment_order_id' => $task->payment_order_id,
                            'referee_user_id' => $task->assigned_to_user_id,
                            'referee_response' => $request->input('status')
                        ]);
                        
                        $refereeTransaction = DB::table('payment_order_approval_transactions')
                            ->where('payment_order_id', $task->payment_order_id)
                            ->where('assigned_to', $task->assigned_to_user_id)
                            ->where('created_at', '>=', now()->subMinutes(5)) // Recent transaction
                            ->first();
                        
                        Log::info('=== REFEREE TRANSACTION SEARCH RESULT (PAYMENT ORDER) ===', [
                            'task_id' => $task->id,
                            'referee_transaction_found' => $refereeTransaction ? true : false,
                            'referee_transaction_id' => $refereeTransaction ? $refereeTransaction->id : null,
                            'referee_transaction_status' => $refereeTransaction ? $refereeTransaction->status : null
                        ]);
                        
                        if ($refereeTransaction) {
                            $newStatus = $request->input('status') === 'Approved' ? 'Approve' : 'Reject';
                            $updateResult = DB::table('payment_order_approval_transactions')
                                ->where('id', $refereeTransaction->id)
                                ->update([
                                    'status' => $newStatus,
                                    'updated_at' => now()
                                ]);
                            
                            Log::info('=== REFEREE TRANSACTION UPDATE RESULT (PAYMENT ORDER) ===', [
                                'task_id' => $task->id,
                                'referee_transaction_id' => $refereeTransaction->id,
                                'new_status' => $newStatus,
                                'update_success' => $updateResult > 0,
                                'rows_affected' => $updateResult
                            ]);
                        } else {
                            Log::error('=== REFEREE TRANSACTION NOT FOUND (PAYMENT ORDER) ===', [
                                'task_id' => $task->id,
                                'payment_order_id' => $task->payment_order_id,
                                'referee_user_id' => $task->assigned_to_user_id,
                                'search_criteria' => 'created_at >= ' . now()->subMinutes(5)
                            ]);
                            
                            // CREATE the referee's transaction since it doesn't exist
                            $newStatus = $request->input('status') === 'Approved' ? 'Approve' : 'Reject';
                            $refereeTransactionId = DB::table('payment_order_approval_transactions')->insertGetId([
                                'payment_order_id' => $task->payment_order_id,
                                'requester_id' => $task->assigned_from_user_id, // Original requester
                                'assigned_to' => $task->assigned_to_user_id, // Referee
                                'referred_to' => null,
                                'order' => 1, // Same order as original
                                'description' => 'Referee response',
                                'status' => $newStatus,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]);
                            
                            Log::info('=== REFEREE TRANSACTION CREATED (PAYMENT ORDER) ===', [
                                'task_id' => $task->id,
                                'payment_order_id' => $task->payment_order_id,
                                'referee_user_id' => $task->assigned_to_user_id,
                                'new_transaction_id' => $refereeTransactionId,
                                'new_status' => $newStatus
                            ]);
                        }

                        DB::table('payment_order_approval_transactions')
                            ->where('payment_order_id', $task->payment_order_id)
                            ->where('assigned_to', $originalTask->assigned_to_user_id)
                            ->where('referred_to', $task->assigned_to_user_id)
                            ->update([
                                'status' => 'Pending', // Change to Pending when referee responds
                                'updated_at' => now()
                            ]);
                    }

                    // Send notification to original approver
                    $newTaskForOriginalApprover->load(['assignedToUser', 'process']);
                    if ($newTaskForOriginalApprover->assignedToUser && $newTaskForOriginalApprover->process) {
                        $notificationService = new TaskNotificationService();
                        $taskType = $notificationService->getTaskTypeFromProcess($newTaskForOriginalApprover->process->title);
                        $notificationService->sendTaskAssignmentNotification($newTaskForOriginalApprover, $taskType);
                    }
                    
                    DB::commit();
                    
                    return response()->json([
                        'message' => 'Referral response recorded successfully',
                        'data' => new TaskResource($task->load([
                            'processStep',
                            'process',
                            'assignedUser',
                            'descriptions',
                            'material_request',
                            'rfq',
                            'purchase_order',
                            'payment_order',
                            'invoice',
                            'budget',
                            'budget_approval_transaction',
                            'request_budget',
                        ]))
                    ], Response::HTTP_OK);
                }
            }

            $task->update($request->validated());

            // Set continue_approval_flow = false when task is referred
            if ($request->input('status') === 'Referred') {
                $oldValue = $task->continue_approval_flow;
                $task->update(['continue_approval_flow' => false]);
                Log::info('=== TASK REFERRED - SETTING continue_approval_flow = false ===', [
                    'task_id' => $task->id,
                    'status' => $request->input('status'),
                    'old_continue_approval_flow' => $oldValue,
                    'new_continue_approval_flow' => false,
                    'assigned_to_user_id' => $task->assigned_to_user_id,
                    'assigned_from_user_id' => $task->assigned_from_user_id
                ]);
            }

            // Check if this is an RFQ task and if it's being approved or referred
            if ($task->rfq_id && in_array($request->input('status'), ['Approved', 'Referred'])) {
                Log::info('=== RFQ TASK APPROVAL CHECK ===', [
                    'task_id' => $task->id,
                    'rfq_id' => $task->rfq_id,
                    'current_order_no' => $task->order_no,
                    'current_status_id' => DB::table('rfqs')->where('id', $task->rfq_id)->value('status_id'),
                    'process_id' => $task->process_id,
                    'assigned_to_user_id' => $task->assigned_to_user_id,
                    'assigned_from_user_id' => $task->assigned_from_user_id // Check if this is a referral response
                ]);

                // IMPORTANT: Proceed with normal approval flow if:
                // 1. Task should continue approval flow (continue_approval_flow == true)
                // 2. This is NOT a referral response task (assigned_from_user_id is null OR this is the original approver)
                $isReferralResponseTask = $task->assigned_from_user_id && $task->continue_approval_flow == false;
                
                if ($task->continue_approval_flow == true && !$isReferralResponseTask) {
                    Log::info('=== PROCEEDING WITH NORMAL APPROVAL FLOW ===', [
                        'task_id' => $task->id,
                        'rfq_id' => $task->rfq_id,
                        'assigned_to_user_id' => $task->assigned_to_user_id,
                        'assigned_from_user_id' => $task->assigned_from_user_id,
                        'continue_approval_flow' => $task->continue_approval_flow,
                        'is_referral_response_task' => $isReferralResponseTask,
                        'note' => 'This is the original approver making the final decision'
                    ]);
                    
                    // Update the corresponding RFQ approval transaction FIRST
                    $approvalTransaction = DB::table('rfq_approval_transactions')
                        ->where('rfq_id', $task->rfq_id)
                        ->where('assigned_to', $task->assigned_to_user_id)
                        ->whereNull('referred_to') // Only get transactions that are NOT referrals
                        ->first();

                    if ($approvalTransaction) {

                        // Update the approval transaction status
                        $transactionUpdated = DB::table('rfq_approval_transactions')
                            ->where('id', $approvalTransaction->id)
                            ->update([
                                'status' => 'Pending', // Change to Pending when referee responds
                                'updated_by' => auth()->id(),
                                'updated_at' => now()
                            ]);

                        if (!$transactionUpdated) {
                            Log::error('=== RFQ APPROVAL TRANSACTION UPDATE FAILED ===', [
                                'task_id' => $task->id,
                                'rfq_id' => $task->rfq_id,
                                'approval_transaction_id' => $approvalTransaction->id
                            ]);
                            throw new \Exception('Failed to update RFQ approval transaction');
                        }
                    } else {
                        Log::warning('=== NO RFQ APPROVAL TRANSACTION FOUND ===', [
                            'task_id' => $task->id,
                            'rfq_id' => $task->rfq_id,
                            'assigned_to' => $task->assigned_to_user_id
                        ]);
                    }

                    // Get total number of required approvals from process steps
                    $processSteps = DB::table('process_steps')
                        ->join('processes', 'process_steps.process_id', '=', 'processes.id')
                        ->where('processes.title', 'RFQ Approval')
                        ->orderBy('process_steps.order')
                        ->get();
                    $totalRequiredApprovals = $processSteps->count();

                    // Check if this is the final approval
                    $isFinalApproval = (string)$task->order_no === (string)$totalRequiredApprovals;

                    // Note: Next task creation is handled by the frontend (ReviewTask.jsx)
                    // No need to trigger backend task creation here to avoid duplicates

                    // Update RFQ status based on approval stage
                    if ($isFinalApproval) {
                        DB::table('rfqs')
                            ->where('id', $task->rfq_id)
                            ->update([
                                'status_id' => 47, // Approved
                                'approved_at' => now(),
                                'approved_by' => auth()->id(),
                                'updated_at' => now()
                            ]);

                        DB::table('rfq_status_logs')->insert([
                            'rfq_id' => $task->rfq_id,
                            'status_id' => 47,
                            'changed_by' => auth()->id(),
                            'remarks' => 'RFQ Approved and Activated by Final Approver',
                            'approved_by' => auth()->id(),
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    } else {
                        Log::info('=== INTERMEDIATE APPROVAL - UPDATING RFQ TO PENDING ===', [
                            'rfq_id' => $task->rfq_id
                        ]);

                        DB::table('rfqs')
                            ->where('id', $task->rfq_id)
                            ->update([
                                'status_id' => 48, // Pending
                                'updated_at' => now()
                            ]);

                        DB::table('rfq_status_logs')->insert([
                            'rfq_id' => $task->rfq_id,
                            'status_id' => 48,
                            'changed_by' => auth()->id(),
                            'remarks' => 'RFQ moved to Pending status',
                            'approved_by' => auth()->id(),
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);
                    }
                } else {
                    Log::info('=== SKIPPING RFQ APPROVAL FLOW ===', [
                        'task_id' => $task->id,
                        'rfq_id' => $task->rfq_id,
                        'continue_approval_flow' => $task->continue_approval_flow,
                        'is_referral_response_task' => $isReferralResponseTask,
                        'reason' => $task->continue_approval_flow == false ? 'continue_approval_flow_is_false' : 'is_referral_response_task',
                        'assigned_from_user_id' => $task->assigned_from_user_id,
                        'note' => 'This task will be handled by referral response logic or is not meant to continue approval flow'
                    ]);
                }
            }

            // Check if this is an RFQ task and if it's being rejected
            if ($task->rfq_id && $request->input('status') === 'Rejected') {
                Log::info('=== RFQ TASK REJECTION CHECK ===', [
                    'task_id' => $task->id,
                    'rfq_id' => $task->rfq_id,
                    'current_status_id' => DB::table('rfqs')->where('id', $task->rfq_id)->value('status_id')
                ]);

                // Update the corresponding approval transaction
                $approvalTransaction = DB::table('rfq_approval_transactions')
                    ->where('rfq_id', $task->rfq_id)
                    ->where('assigned_to', $task->assigned_to_user_id)
                    ->first();

                if ($approvalTransaction) {
                    Log::info('=== UPDATING RFQ APPROVAL TRANSACTION FOR REJECTION ===', [
                        'task_id' => $task->id,
                        'rfq_id' => $task->rfq_id,
                        'approval_transaction_id' => $approvalTransaction->id
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('rfq_approval_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Reject',
                            'updated_at' => now()
                        ]);

                    Log::info('=== RFQ REJECTION TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'rfq_id' => $task->rfq_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Immediately update RFQ status to Rejected (49)
                        $rfqUpdated = DB::table('rfqs')
                            ->where('id', $task->rfq_id)
                            ->update([
                                'status_id' => 49,
                                'updated_at' => now()
                            ]);

                        Log::info('=== RFQ REJECTION STATUS UPDATE RESULT ===', [
                            'task_id' => $task->id,
                            'rfq_id' => $task->rfq_id,
                            'update_success' => $rfqUpdated,
                            'new_status_id' => DB::table('rfqs')->where('id', $task->rfq_id)->value('status_id')
                        ]);

                        // Create status log entry for rejection
                        DB::table('rfq_status_logs')->insert([
                            'rfq_id' => $task->rfq_id,
                            'status_id' => 49,
                            'changed_by' => auth()->id(),
                            'remarks' => 'RFQ Rejected by Approver',
                            'approved_by' => auth()->id(),
                            'created_at' => now(),
                            'updated_at' => now()
                        ]);

                        // Update any material requests that are in "Referred" status and related to this RFQ
                        // This handles the case where material request was referred for RFQ and RFQ gets rejected
                        $rfqRequests = DB::table('rfq_requests')
                            ->where('rfq_id', $task->rfq_id)
                            ->get();

                        foreach ($rfqRequests as $rfqRequest) {
                            // Find material requests that match this RFQ request details
                            $materialRequests = DB::table('material_requests')
                                ->where('status_id', 2) // Referred status
                                ->where('department_id', $rfqRequest->department_id)
                                ->where('cost_center_id', $rfqRequest->cost_center_id)
                                ->where('warehouse_id', $rfqRequest->warehouse_id)
                                ->get();

                            foreach ($materialRequests as $materialRequest) {
                                // Update material request status to Rejected
                                DB::table('material_requests')
                                    ->where('id', $materialRequest->id)
                                    ->update([
                                        'status_id' => 52, // Rejected status
                                        'updated_at' => now()
                                    ]);

                                Log::info('=== MATERIAL REQUEST UPDATED TO REJECTED DUE TO RFQ REJECTION ===', [
                                    'material_request_id' => $materialRequest->id,
                                    'rfq_id' => $task->rfq_id,
                                    'rfq_request_id' => $rfqRequest->id
                                ]);
                            }
                        }
                    }
                } else {
                    Log::warning('=== NO RFQ APPROVAL TRANSACTION FOUND ===', [
                        'task_id' => $task->id,
                        'rfq_id' => $task->rfq_id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);
                }
            }

            // Check if this is a Maharat Invoice task and if it's being approved or referred
            if ($task->invoice_id && in_array($request->input('status'), ['Approved', 'Referred'])) {
                Log::info('=== MAHARAT INVOICE TASK APPROVAL CHECK ===', [
                    'task_id' => $task->id,
                    'invoice_id' => $task->invoice_id,
                    'current_order_no' => $task->order_no,
                    'current_status' => DB::table('invoices')->where('id', $task->invoice_id)->value('status')
                ]);

                // IMPORTANT: Proceed with normal approval flow if:
                // 1. Task should continue approval flow (continue_approval_flow == true)
                // 2. This is NOT a referral response task (assigned_from_user_id is null OR this is the original approver)
                $isReferralResponseTask = $task->assigned_from_user_id && $task->continue_approval_flow == false;
                
                if ($task->continue_approval_flow == true && !$isReferralResponseTask) {
                    Log::info('=== PROCEEDING WITH NORMAL MAHARAT INVOICE APPROVAL FLOW ===', [
                        'task_id' => $task->id,
                        'invoice_id' => $task->invoice_id,
                        'assigned_to_user_id' => $task->assigned_to_user_id,
                        'assigned_from_user_id' => $task->assigned_from_user_id,
                        'continue_approval_flow' => $task->continue_approval_flow,
                        'is_referral_response_task' => $isReferralResponseTask,
                        'note' => 'This is the original approver making the final decision'
                    ]);
                    
                    // Update the corresponding approval transaction
                    $approvalTransaction = DB::table('mahrat_invoice_approval_transactions')
                        ->where('invoice_id', $task->invoice_id)
                        ->where('assigned_to', $task->assigned_to_user_id)
                        ->first();

                    if ($approvalTransaction) {
                    Log::info('=== UPDATING MAHARAT INVOICE APPROVAL TRANSACTION ===', [
                        'task_id' => $task->id,
                        'invoice_id' => $task->invoice_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('mahrat_invoice_approval_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Pending', // Change to Pending when referee responds
                            'updated_by' => auth()->id(),
                            'updated_at' => now()
                        ]);

                    Log::info('=== APPROVAL TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'invoice_id' => $task->invoice_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Check if this is the final approval
                        $totalApprovals = DB::table('mahrat_invoice_approval_transactions')
                            ->where('invoice_id', $task->invoice_id)
                            ->count();

                        $completedApprovals = DB::table('mahrat_invoice_approval_transactions')
                            ->where('invoice_id', $task->invoice_id)
                            ->where('status', 'Approve')
                            ->count();

                        $isFinalApproval = $completedApprovals === $totalApprovals;

                        Log::info('=== MAHARAT INVOICE FINAL APPROVAL CHECK ===', [
                            'task_id' => $task->id,
                            'invoice_id' => $task->invoice_id,
                            'total_approvals' => $totalApprovals,
                            'completed_approvals' => $completedApprovals,
                            'is_final_approval' => $isFinalApproval
                        ]);

                        if ($isFinalApproval) {
                            Log::info('=== FINAL MAHARAT INVOICE APPROVAL - UPDATING STATUS AND ACCOUNTS ===', [
                                'task_id' => $task->id,
                                'invoice_id' => $task->invoice_id,
                                'current_status' => DB::table('invoices')->where('id', $task->invoice_id)->value('status'),
                                'target_status' => 'Approved'
                            ]);

                            // Update invoice status to Approved
                            $invoiceUpdated = DB::table('invoices')
                                ->where('id', $task->invoice_id)
                                ->update([
                                    'status' => 'Approved',
                                    'updated_at' => now()
                                ]);

                            Log::info('=== INVOICE STATUS UPDATE RESULT ===', [
                                'task_id' => $task->id,
                                'invoice_id' => $task->invoice_id,
                                'update_success' => $invoiceUpdated,
                                'new_status' => DB::table('invoices')->where('id', $task->invoice_id)->value('status')
                            ]);

                            if ($invoiceUpdated) {
                                // Get invoice details for account updates
                                $invoice = DB::table('invoices')->where('id', $task->invoice_id)->first();
                                
                                if ($invoice) {
                                    Log::info('=== UPDATING ACCOUNTS FOR APPROVED INVOICE ===', [
                                        'task_id' => $task->id,
                                        'invoice_id' => $invoice->id,
                                        'subtotal' => $invoice->subtotal,
                                        'tax_amount' => $invoice->tax_amount,
                                        'total_amount' => $invoice->total_amount
                                    ]);

                                    // Update Revenue/Income account (ID 4) with subtotal
                                    $revenueAccountUpdated = DB::table('accounts')
                                        ->where('id', 4)
                                        ->where('name', 'Revenue/Income')
                                        ->update([
                                            'credit_amount' => DB::raw('COALESCE(credit_amount, 0) + ' . $invoice->subtotal),
                                            'updated_by' => auth()->id(),
                                            'updated_at' => now()
                                        ]);

                                    Log::info('=== REVENUE ACCOUNT UPDATE RESULT ===', [
                                        'task_id' => $task->id,
                                        'invoice_id' => $invoice->id,
                                        'account_id' => 4,
                                        'account_name' => 'Revenue/Income',
                                        'amount_added' => $invoice->subtotal,
                                        'update_success' => $revenueAccountUpdated
                                    ]);

                                    // Update VAT Receivables account (ID 13) with tax_amount
                                    $vatAccountUpdated = DB::table('accounts')
                                        ->where('id', 13)
                                        ->where('name', 'VAT Receivables (On Maharat Invoice)')
                                        ->update([
                                            'credit_amount' => DB::raw('COALESCE(credit_amount, 0) + ' . $invoice->tax_amount),
                                            'updated_by' => auth()->id(),
                                            'updated_at' => now()
                                        ]);

                                    Log::info('=== VAT RECEIVABLES ACCOUNT UPDATE RESULT ===', [
                                        'task_id' => $task->id,
                                        'invoice_id' => $invoice->id,
                                        'account_id' => 13,
                                        'account_name' => 'VAT Receivables (On Maharat Invoice)',
                                        'amount_added' => $invoice->tax_amount,
                                        'update_success' => $vatAccountUpdated
                                    ]);

                                    // Update Account Receivable account (ID 11) with total_amount
                                    $receivableAccountUpdated = DB::table('accounts')
                                        ->where('id', 11)
                                        ->where('name', 'Account Receivable')
                                        ->update([
                                            'credit_amount' => DB::raw('COALESCE(credit_amount, 0) + ' . $invoice->total_amount),
                                            'updated_by' => auth()->id(),
                                            'updated_at' => now()
                                        ]);

                                    Log::info('=== ACCOUNT RECEIVABLE UPDATE RESULT ===', [
                                        'task_id' => $task->id,
                                        'invoice_id' => $invoice->id,
                                        'account_id' => 11,
                                        'account_name' => 'Account Receivable',
                                        'amount_added' => $invoice->total_amount,
                                        'update_success' => $receivableAccountUpdated
                                    ]);

                                    if ($revenueAccountUpdated && $vatAccountUpdated && $receivableAccountUpdated) {
                                        Log::info('=== ALL ACCOUNT UPDATES COMPLETED SUCCESSFULLY ===', [
                                            'task_id' => $task->id,
                                            'invoice_id' => $invoice->id,
                                            'revenue_account_updated' => $revenueAccountUpdated,
                                            'vat_receivables_account_updated' => $vatAccountUpdated,
                                            'account_receivable_updated' => $receivableAccountUpdated
                                        ]);

                                        // Record transaction flows for audit trail
                                        try {
                                            Log::info('=== RECORDING TRANSACTION FLOWS FOR INVOICE APPROVAL ===', [
                                                'task_id' => $task->id,
                                                'invoice_id' => $invoice->id
                                            ]);

                                            $transactionFlows = TransactionFlowService::recordInvoiceApprovalFlows($invoice);

                                            Log::info('=== TRANSACTION FLOWS RECORDED SUCCESSFULLY ===', [
                                                'task_id' => $task->id,
                                                'invoice_id' => $invoice->id,
                                                'flows_count' => count($transactionFlows),
                                                'flow_ids' => array_map(function($flow) {
                                                    return $flow->id;
                                                }, $transactionFlows)
                                            ]);
                                        } catch (\Exception $e) {
                                            Log::error('=== FAILED TO RECORD TRANSACTION FLOWS ===', [
                                                'task_id' => $task->id,
                                                'invoice_id' => $invoice->id,
                                                'error' => $e->getMessage(),
                                                'trace' => $e->getTraceAsString()
                                            ]);
                                            // Don't throw the exception as account updates were successful
                                        }

                                        // Update budget revenue after successful account updates
                                        Log::info('=== UPDATING BUDGET REVENUE FOR APPROVED INVOICE ===', [
                                            'task_id' => $task->id,
                                            'invoice_id' => $invoice->id,
                                            'invoice_amount' => $invoice->total_amount,
                                            'invoice_date' => $invoice->issue_date
                                        ]);

                                        $budgetService = new \App\Services\BudgetRevenueUpdateService();
                                        $budgetUpdateResult = $budgetService->updateBudgetRevenue($invoice);

                                        if ($budgetUpdateResult['success']) {
                                            Log::info('=== BUDGET REVENUE UPDATED SUCCESSFULLY ===', [
                                                'task_id' => $task->id,
                                                'invoice_id' => $invoice->id,
                                                'message' => $budgetUpdateResult['message'],
                                                'budgets_updated' => $budgetUpdateResult['budgets_updated']
                                            ]);
                                        } else {
                                            Log::warning('=== BUDGET REVENUE UPDATE FAILED ===', [
                                                'task_id' => $task->id,
                                                'invoice_id' => $invoice->id,
                                                'message' => $budgetUpdateResult['message']
                                            ]);
                                        }
                                    } else {
                                        Log::warning('=== SOME ACCOUNT UPDATES FAILED ===', [
                                            'task_id' => $task->id,
                                            'invoice_id' => $invoice->id,
                                            'revenue_account_updated' => $revenueAccountUpdated,
                                            'vat_receivables_account_updated' => $vatAccountUpdated,
                                            'account_receivable_updated' => $receivableAccountUpdated
                                        ]);
                                    }
                                }
                            }
                        } else {
                            Log::info('=== NOT FINAL MAHARAT INVOICE APPROVAL - KEEPING DRAFT STATUS ===', [
                                'task_id' => $task->id,
                                'invoice_id' => $task->invoice_id,
                                'total_approvals' => $totalApprovals,
                                'completed_approvals' => $completedApprovals
                            ]);
                            // Update invoice status to Pending for non-final approver
                            DB::table('invoices')
                                ->where('id', $task->invoice_id)
                                ->update([
                                    'status' => 'Pending',
                                    'updated_at' => now()
                                ]);
                        }
                    }
                } else {
                    Log::warning('=== NO APPROVAL TRANSACTION FOUND FOR INVOICE ===', [
                        'task_id' => $task->id,
                        'invoice_id' => $task->invoice_id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);
                }
            }

            // Check if this is a Maharat Invoice task and if it's being rejected
            if ($task->invoice_id && $request->input('status') === 'Rejected') {
                Log::info('=== MAHARAT INVOICE TASK REJECTION CHECK ===', [
                    'task_id' => $task->id,
                    'invoice_id' => $task->invoice_id,
                    'current_status' => DB::table('invoices')->where('id', $task->invoice_id)->value('status')
                ]);

                // Update the corresponding approval transaction
                $approvalTransaction = DB::table('mahrat_invoice_approval_transactions')
                    ->where('invoice_id', $task->invoice_id)
                    ->where('assigned_to', $task->assigned_to_user_id)
                    ->first();

                if ($approvalTransaction) {
                    Log::info('=== UPDATING MAHARAT INVOICE APPROVAL TRANSACTION FOR REJECTION ===', [
                        'task_id' => $task->id,
                        'invoice_id' => $task->invoice_id,
                        'approval_transaction_id' => $approvalTransaction->id
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('mahrat_invoice_approval_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Reject',
                            'updated_by' => auth()->id(),
                            'updated_at' => now()
                        ]);

                    Log::info('=== REJECTION TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'invoice_id' => $task->invoice_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Immediately update invoice status to Cancelled
                        $invoiceUpdated = DB::table('invoices')
                            ->where('id', $task->invoice_id)
                            ->update([
                                'status' => 'Cancelled',
                                'updated_at' => now()
                            ]);

                        Log::info('=== INVOICE REJECTION STATUS UPDATE RESULT ===', [
                            'task_id' => $task->id,
                            'invoice_id' => $task->invoice_id,
                            'update_success' => $invoiceUpdated,
                            'new_status' => DB::table('invoices')->where('id', $task->invoice_id)->value('status')
                        ]);
                    }
                }
                }
            }

            // Check if this is a Budget Request task and if it's being approved or referred
            if ($task->request_budgets_id && in_array($request->input('status'), ['Approved', 'Referred'])) {
                Log::info('=== BUDGET REQUEST TASK APPROVAL CHECK ===', [
                    'task_id' => $task->id,
                    'request_budget_id' => $task->request_budgets_id,
                    'current_order_no' => $task->order_no,
                    'current_status' => DB::table('request_budgets')->where('id', $task->request_budgets_id)->value('status')
                ]);

                // IMPORTANT: Proceed with normal approval flow if:
                // 1. Task should continue approval flow (continue_approval_flow == true)
                // 2. This is NOT a referral response task (assigned_from_user_id is null OR this is the original approver)
                $isReferralResponseTask = $task->assigned_from_user_id && $task->continue_approval_flow == false;
                
                if ($task->continue_approval_flow == true && !$isReferralResponseTask) {
                    Log::info('=== PROCEEDING WITH NORMAL BUDGET REQUEST APPROVAL FLOW ===', [
                        'task_id' => $task->id,
                        'request_budget_id' => $task->request_budgets_id,
                        'assigned_to_user_id' => $task->assigned_to_user_id,
                        'assigned_from_user_id' => $task->assigned_from_user_id,
                        'continue_approval_flow' => $task->continue_approval_flow,
                        'is_referral_response_task' => $isReferralResponseTask,
                        'note' => 'This is the original approver making the final decision'
                    ]);
                    
                    // Find the corresponding approval transaction
                    $approvalTransaction = DB::table('budget_request_approval_transactions')
                    ->where('request_budgets_id', $task->request_budgets_id)
                    ->where('assigned_to', $task->assigned_to_user_id)
                    ->first();

                if ($approvalTransaction) {
                    Log::info('=== FOUND APPROVAL TRANSACTION, UPDATING IT ===', [
                        'task_id' => $task->id,
                        'request_budget_id' => $task->request_budgets_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);

                    // Check if this will be the final approval BEFORE updating the transaction
                    // Get the process steps to determine the total number of required approvals
                    $processSteps = DB::table('process_steps')
                        ->join('processes', 'process_steps.process_id', '=', 'processes.id')
                        ->where('processes.title', 'Budget Request Approval')
                        ->orderBy('process_steps.order')
                        ->get();

                    $totalRequiredApprovals = $processSteps->count();
                    
                    // Check if this is the final approval (current order equals total required approvals)
                    $isFinalApproval = $approvalTransaction->order == $totalRequiredApprovals;

                    Log::info('=== BUDGET REQUEST FINAL APPROVAL CHECK ===', [
                        'task_id' => $task->id,
                        'request_budget_id' => $task->request_budgets_id,
                        'current_order' => $approvalTransaction->order,
                        'total_required_approvals' => $totalRequiredApprovals,
                        'is_final_approval' => $isFinalApproval,
                        'process_steps_count' => $processSteps->count()
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('budget_request_approval_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Pending', // Change to Pending when referee responds
                            'updated_by' => auth()->id(),
                            'updated_at' => now()
                        ]);

                    Log::info('=== BUDGET REQUEST APPROVAL TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'request_budget_id' => $task->request_budgets_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Now trigger the budget request approval logic
                        if ($isFinalApproval) {
                            Log::info('=== FINAL BUDGET REQUEST APPROVAL - UPDATING STATUS AND CREATING BUDGET ===', [
                                'task_id' => $task->id,
                                'request_budget_id' => $task->request_budgets_id,
                                'current_status' => DB::table('request_budgets')->where('id', $task->request_budgets_id)->value('status'),
                                'target_status' => 'Approved'
                            ]);

                            // Update budget request status to Approved
                            $budgetRequestUpdated = DB::table('request_budgets')
                                ->where('id', $task->request_budgets_id)
                                ->update([
                                    'status' => 'Approved',
                                    'approved_amount' => DB::raw('requested_amount'),
                                    'balance_amount' => DB::raw('requested_amount'),
                                    'updated_at' => now()
                                ]);

                            Log::info('=== BUDGET REQUEST STATUS UPDATE RESULT ===', [
                                'task_id' => $task->id,
                                'request_budget_id' => $task->request_budgets_id,
                                'update_success' => $budgetRequestUpdated,
                                'new_status' => DB::table('request_budgets')->where('id', $task->request_budgets_id)->value('status')
                            ]);

                            if ($budgetRequestUpdated) {
                                // Create budget in budgets table from approved budget request
                                $budgetRequest = DB::table('request_budgets')->where('id', $task->request_budgets_id)->first();
                                
                                if ($budgetRequest) {
                                    Log::info('=== CREATING BUDGET FROM APPROVED BUDGET REQUEST ===', [
                                        'task_id' => $task->id,
                                        'request_budget_id' => $budgetRequest->id,
                                        'fiscal_period_id' => $budgetRequest->fiscal_period_id,
                                        'department_id' => $budgetRequest->department_id,
                                        'cost_center_id' => $budgetRequest->cost_center_id,
                                        'sub_cost_center_id' => $budgetRequest->sub_cost_center
                                    ]);

                                    // Check if budget already exists for this combination
                                    $existingBudget = DB::table('budgets')
                                        ->where('fiscal_period_id', $budgetRequest->fiscal_period_id)
                                        ->where('department_id', $budgetRequest->department_id)
                                        ->where('cost_center_id', $budgetRequest->cost_center_id)
                                        ->where('sub_cost_center_id', $budgetRequest->sub_cost_center)
                                        ->first();

                                    if ($existingBudget) {
                                        Log::warning('=== BUDGET ALREADY EXISTS, UPDATING INSTEAD ===', [
                                            'task_id' => $task->id,
                                            'request_budget_id' => $budgetRequest->id,
                                            'existing_budget_id' => $existingBudget->id
                                        ]);

                                        // Update existing budget
                                        DB::table('budgets')
                                            ->where('id', $existingBudget->id)
                                            ->update([
                                                'total_expense_planned' => $budgetRequest->requested_amount,
                                                'total_revenue_planned' => $budgetRequest->revenue_planned,
                                                'description' => 'Budget updated from approved budget request',
                                                'status' => 'Active',
                                                'updated_by' => auth()->id(),
                                                'updated_at' => now()
                                            ]);

                                        // Update the budget request to link to the existing budget
                                        DB::table('request_budgets')
                                            ->where('id', $budgetRequest->id)
                                            ->update([
                                                'budget_id' => $existingBudget->id,
                                                'updated_at' => now()
                                            ]);
                                    } else {
                                        // Create new budget
                                        try {
                                            $newBudgetId = DB::table('budgets')->insertGetId([
                                                'fiscal_period_id' => $budgetRequest->fiscal_period_id,
                                                'department_id' => $budgetRequest->department_id,
                                                'cost_center_id' => $budgetRequest->cost_center_id,
                                                'sub_cost_center_id' => $budgetRequest->sub_cost_center,
                                                'request_budget_id' => $budgetRequest->id,
                                                'description' => 'Budget created from approved budget request',
                                                'total_revenue_planned' => $budgetRequest->revenue_planned,
                                                'total_revenue_actual' => 0,
                                                'total_expense_planned' => $budgetRequest->requested_amount,
                                                'total_expense_actual' => 0,
                                                'status' => 'Pending',
                                                'attachment_path' => $budgetRequest->attachment_path,
                                                'original_name' => $budgetRequest->original_name,
                                                'created_by' => auth()->id(),
                                                'updated_by' => auth()->id(),
                                                'created_at' => now(),
                                                'updated_at' => now()
                                            ]);

                                            // Update the budget request to link to the new budget
                                            DB::table('request_budgets')
                                                ->where('id', $budgetRequest->id)
                                                ->update([
                                                    'budget_id' => $newBudgetId,
                                                    'updated_at' => now()
                                                ]);

                                            Log::info('=== NEW BUDGET CREATED SUCCESSFULLY ===', [
                                                'task_id' => $task->id,
                                                'request_budget_id' => $budgetRequest->id,
                                                'new_budget_id' => $newBudgetId
                                            ]);
                                        } catch (\Exception $e) {
                                            Log::error('=== FAILED TO CREATE BUDGET ===', [
                                                'task_id' => $task->id,
                                                'request_budget_id' => $budgetRequest->id,
                                                'error' => $e->getMessage(),
                                                'trace' => $e->getTraceAsString(),
                                                'budget_data' => [
                                                    'fiscal_period_id' => $budgetRequest->fiscal_period_id,
                                                    'department_id' => $budgetRequest->department_id,
                                                    'cost_center_id' => $budgetRequest->cost_center_id,
                                                    'sub_cost_center_id' => $budgetRequest->sub_cost_center,
                                                    'revenue_planned' => $budgetRequest->revenue_planned,
                                                    'requested_amount' => $budgetRequest->requested_amount
                                                ]
                                            ]);
                                            throw $e;
                                        }
                                    }
                                }
                            }
                        } else {
                            Log::info('=== NOT FINAL BUDGET REQUEST APPROVAL - UPDATING TO PENDING ===', [
                                'task_id' => $task->id,
                                'request_budget_id' => $task->request_budgets_id,
                                'total_required_approvals' => $totalRequiredApprovals
                            ]);

                            // Update budget request status to Pending
                            $budgetRequestUpdated = DB::table('request_budgets')
                                ->where('id', $task->request_budgets_id)
                                ->update([
                                    'status' => 'Pending',
                                    'updated_at' => now()
                                ]);

                            Log::info('=== BUDGET REQUEST STATUS UPDATE TO PENDING RESULT ===', [
                                'task_id' => $task->id,
                                'request_budget_id' => $task->request_budgets_id,
                                'update_success' => $budgetRequestUpdated,
                                'new_status' => DB::table('request_budgets')->where('id', $task->request_budgets_id)->value('status')
                            ]);
                        }
                    }
                } else {
                    Log::warning('=== NO APPROVAL TRANSACTION FOUND FOR BUDGET REQUEST ===', [
                        'task_id' => $task->id,
                        'request_budget_id' => $task->request_budgets_id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);
                }
                }
            }

            // Check if this is a Budget Request task and if it's being rejected
            if ($task->request_budgets_id && $request->input('status') === 'Rejected') {
                Log::info('=== BUDGET REQUEST TASK REJECTION CHECK ===', [
                    'task_id' => $task->id,
                    'request_budget_id' => $task->request_budgets_id,
                    'current_status' => DB::table('request_budgets')->where('id', $task->request_budgets_id)->value('status')
                ]);

                // Update the corresponding approval transaction
                $approvalTransaction = DB::table('budget_request_approval_transactions')
                    ->where('request_budgets_id', $task->request_budgets_id)
                    ->where('assigned_to', $task->assigned_to_user_id)
                    ->first();

                if ($approvalTransaction) {
                    Log::info('=== UPDATING BUDGET REQUEST APPROVAL TRANSACTION FOR REJECTION ===', [
                        'task_id' => $task->id,
                        'request_budget_id' => $task->request_budgets_id,
                        'approval_transaction_id' => $approvalTransaction->id
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('budget_request_approval_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Reject',
                            'updated_by' => auth()->id(),
                            'updated_at' => now()
                        ]);

                    Log::info('=== BUDGET REQUEST REJECTION TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'request_budget_id' => $task->request_budgets_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Immediately update budget request status to Rejected
                        $budgetRequestUpdated = DB::table('request_budgets')
                            ->where('id', $task->request_budgets_id)
                            ->update([
                                'status' => 'Rejected',
                                'updated_at' => now()
                            ]);

                        Log::info('=== BUDGET REQUEST REJECTION STATUS UPDATE RESULT ===', [
                            'task_id' => $task->id,
                            'request_budget_id' => $task->request_budgets_id,
                            'update_success' => $budgetRequestUpdated,
                            'new_status' => DB::table('request_budgets')->where('id', $task->request_budgets_id)->value('status')
                        ]);
                    }
                }
            }

            // Check if this is a Budget Approval task and if it's being approved or referred
            if ($task->budget_id && in_array($request->input('status'), ['Approved', 'Referred'])) {
                Log::info('=== BUDGET APPROVAL TASK APPROVAL CHECK ===', [
                    'task_id' => $task->id,
                    'budget_id' => $task->budget_id,
                    'current_status' => DB::table('budgets')->where('id', $task->budget_id)->value('status')
                ]);

                // IMPORTANT: Proceed with normal approval flow if:
                // 1. Task should continue approval flow (continue_approval_flow == true)
                // 2. This is NOT a referral response task (assigned_from_user_id is null OR this is the original approver)
                $isReferralResponseTask = $task->assigned_from_user_id && $task->continue_approval_flow == false;
                
                if ($task->continue_approval_flow == true && !$isReferralResponseTask) {
                    Log::info('=== PROCEEDING WITH NORMAL BUDGET APPROVAL FLOW ===', [
                        'task_id' => $task->id,
                        'budget_id' => $task->budget_id,
                        'assigned_to_user_id' => $task->assigned_to_user_id,
                        'assigned_from_user_id' => $task->assigned_from_user_id,
                        'continue_approval_flow' => $task->continue_approval_flow,
                        'is_referral_response_task' => $isReferralResponseTask,
                        'note' => 'This is the original approver making the final decision'
                    ]);
                    
                    // Find the corresponding budget approval transaction
                    $approvalTransaction = DB::table('budget_approval_transactions')
                    ->where('budget_id', $task->budget_id)
                    ->where('assigned_to', $task->assigned_to_user_id)
                    ->first();

                if ($approvalTransaction) {
                    Log::info('=== FOUND BUDGET APPROVAL TRANSACTION, UPDATING IT ===', [
                        'task_id' => $task->id,
                        'budget_id' => $task->budget_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('budget_approval_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Approve',
                            'updated_by' => auth()->id(),
                            'updated_at' => now()
                        ]);

                    Log::info('=== BUDGET APPROVAL TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'budget_id' => $task->budget_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Trigger the budget approval service to update budget status
                        $approvalService = new \App\Services\BudgetApprovalService();
                        $approvalResult = $approvalService->checkApprovalCompletion($task->budget_id, $approvalTransaction->id);
                        
                        Log::info('=== BUDGET APPROVAL COMPLETION CHECK ===', [
                            'task_id' => $task->id,
                            'budget_id' => $task->budget_id,
                            'approval_result' => $approvalResult
                        ]);
                        
                        if ($approvalResult === 'Approve' || $approvalResult === 'Reject') {
                            $approvalService->updateBudgetStatus($task->budget_id, $approvalResult);
                            
                            Log::info('=== BUDGET STATUS UPDATED ===', [
                                'task_id' => $task->id,
                                'budget_id' => $task->budget_id,
                                'new_status' => DB::table('budgets')->where('id', $task->budget_id)->value('status')
                            ]);
                        }

                        // Send notifications for Total Budget Approval
                        $notificationService = new \App\Services\TaskNotificationService();
                        
                        // Get the original initiator from the first budget approval transaction (order = 1)
                        $originalInitiator = DB::table('budget_approval_transactions')
                            ->where('budget_id', $task->budget_id)
                            ->where('order', 1)
                            ->first();
                        
                        Log::info('=== TOTAL BUDGET APPROVAL NOTIFICATION CHECK ===', [
                            'task_id' => $task->id,
                            'budget_id' => $task->budget_id,
                            'originalInitiatorId' => $originalInitiator ? $originalInitiator->id : null,
                            'originalInitiatorOrder' => $originalInitiator ? $originalInitiator->order : null,
                            'originalInitiatorCreatedBy' => $originalInitiator ? $originalInitiator->created_by : null,
                            'currentTransactionOrder' => $approvalTransaction->order,
                            'approvalResult' => $approvalResult
                        ]);
                        
                        if ($originalInitiator && $originalInitiator->created_by) {
                            $requester = \App\Models\User::find($originalInitiator->created_by);
                            
                            if ($requester) {
                                if ($approvalResult === 'Approve' || $approvalResult === 'Pending') {
                                    // Check if this is the final approval
                                    $processSteps = DB::table('process_steps')
                                        ->join('processes', 'process_steps.process_id', '=', 'processes.id')
                                        ->where('processes.title', 'Total Budget Approval')
                                        ->orderBy('process_steps.order')
                                        ->get();
                                    $totalRequiredApprovals = $processSteps->count();
                                    $isFinalApproval = $approvalTransaction->order == $totalRequiredApprovals;
                                    
                                    if ($isFinalApproval) {
                                        // Send final approval notification
                                        $notificationService->sendFinalStatusNotification($task, 'Total Budget Approval', 'Approved', $requester);
                                        Log::info('=== TOTAL BUDGET FINAL APPROVAL NOTIFICATION SENT ===', [
                                            'task_id' => $task->id,
                                            'requester_id' => $requester->id,
                                            'requester_email' => $requester->email
                                        ]);
                                    } else {
                                        // Send intermediate approval notification
                                        $comment = "Approved by " . auth()->user()->name . " (Step " . $approvalTransaction->order . ")";
                                        $notificationService->sendIntermediateStatusNotification($task, 'Total Budget Approval', 'Approved', $requester, $comment);
                                        Log::info('=== TOTAL BUDGET INTERMEDIATE APPROVAL NOTIFICATION SENT ===', [
                                            'task_id' => $task->id,
                                            'requester_id' => $requester->id,
                                            'requester_email' => $requester->email,
                                            'step' => $approvalTransaction->order
                                        ]);
                                    }
                                } elseif ($approvalResult === 'Reject') {
                                    // Send rejection notification
                                    $notificationService->sendFinalStatusNotification($task, 'Total Budget Approval', 'Rejected', $requester);
                                    Log::info('=== TOTAL BUDGET REJECTION NOTIFICATION SENT ===', [
                                        'task_id' => $task->id,
                                        'requester_id' => $requester->id,
                                        'requester_email' => $requester->email
                                    ]);
                                }
                            }
                        }
                    }
                } else {
                    Log::warning('=== NO BUDGET APPROVAL TRANSACTION FOUND ===', [
                        'task_id' => $task->id,
                        'budget_id' => $task->budget_id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);
                }
                }
            }

            // Check if this is a Budget Approval task and if it's being rejected
            if ($task->budget_id && $request->input('status') === 'Rejected') {
                Log::info('=== BUDGET APPROVAL TASK REJECTION CHECK ===', [
                    'task_id' => $task->id,
                    'budget_id' => $task->budget_id,
                    'current_status' => DB::table('budgets')->where('id', $task->budget_id)->value('status')
                ]);

                // Find the corresponding budget approval transaction
                $approvalTransaction = DB::table('budget_approval_transactions')
                    ->where('budget_id', $task->budget_id)
                    ->where('assigned_to', $task->assigned_to_user_id)
                    ->first();

                if ($approvalTransaction) {
                    Log::info('=== UPDATING BUDGET APPROVAL TRANSACTION FOR REJECTION ===', [
                        'task_id' => $task->id,
                        'budget_id' => $task->budget_id,
                        'approval_transaction_id' => $approvalTransaction->id
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('budget_approval_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Reject',
                            'updated_by' => auth()->id(),
                            'updated_at' => now()
                        ]);

                    Log::info('=== BUDGET APPROVAL REJECTION TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'budget_id' => $task->budget_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Trigger the budget approval service to update budget status
                        $approvalService = new \App\Services\BudgetApprovalService();
                        $approvalResult = $approvalService->checkApprovalCompletion($task->budget_id, $approvalTransaction->id);
                        
                        Log::info('=== BUDGET APPROVAL COMPLETION CHECK ===', [
                            'task_id' => $task->id,
                            'budget_id' => $task->budget_id,
                            'approval_result' => $approvalResult
                        ]);
                        
                        if ($approvalResult === 'Approve' || $approvalResult === 'Reject') {
                            $approvalService->updateBudgetStatus($task->budget_id, $approvalResult);
                            
                            Log::info('=== BUDGET STATUS UPDATED ===', [
                                'task_id' => $task->id,
                                'budget_id' => $task->budget_id,
                                'new_status' => DB::table('budgets')->where('id', $task->budget_id)->value('status')
                            ]);
                        }
                    }
                } else {
                    Log::warning('=== NO BUDGET APPROVAL TRANSACTION FOUND FOR REJECTION ===', [
                        'task_id' => $task->id,
                        'budget_id' => $task->budget_id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);
                }
            }

            // Check if this is a Purchase Order task and if it's being approved or referred
            if ($task->purchase_order_id && in_array($request->input('status'), ['Approved', 'Referred'])) {
                Log::info('=== PURCHASE ORDER TASK APPROVAL CHECK ===', [
                    'task_id' => $task->id,
                    'purchase_order_id' => $task->purchase_order_id,
                    'current_order_no' => $task->order_no,
                    'current_status' => DB::table('purchase_orders')->where('id', $task->purchase_order_id)->value('status')
                ]);

                // IMPORTANT: Proceed with normal approval flow if:
                // 1. Task should continue approval flow (continue_approval_flow == true)
                // 2. This is NOT a referral response task (assigned_from_user_id is null OR this is the original approver)
                $isReferralResponseTask = $task->assigned_from_user_id && $task->continue_approval_flow == false;
                
                if ($task->continue_approval_flow == true && !$isReferralResponseTask) {
                    Log::info('=== PROCEEDING WITH NORMAL PURCHASE ORDER APPROVAL FLOW ===', [
                        'task_id' => $task->id,
                        'purchase_order_id' => $task->purchase_order_id,
                        'assigned_to_user_id' => $task->assigned_to_user_id,
                        'assigned_from_user_id' => $task->assigned_from_user_id,
                        'continue_approval_flow' => $task->continue_approval_flow,
                        'is_referral_response_task' => $isReferralResponseTask,
                        'note' => 'This is the original approver making the final decision'
                    ]);
                    
                    // Update the corresponding approval transaction
                    $approvalTransaction = DB::table('po_approval_transactions')
                    ->where('purchase_order_id', $task->purchase_order_id)
                    ->where('assigned_to', $task->assigned_to_user_id)
                    ->first();

                if ($approvalTransaction) {
                    Log::info('=== UPDATING PURCHASE ORDER APPROVAL TRANSACTION ===', [
                        'task_id' => $task->id,
                        'purchase_order_id' => $task->purchase_order_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('po_approval_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Approve',
                            'updated_by' => auth()->id(),
                            'updated_at' => now()
                        ]);

                    Log::info('=== PURCHASE ORDER APPROVAL TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'purchase_order_id' => $task->purchase_order_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Now check if this is the final approval
                        $totalApprovals = DB::table('po_approval_transactions')
                            ->where('purchase_order_id', $task->purchase_order_id)
                            ->count();

                        $completedApprovals = DB::table('po_approval_transactions')
                            ->where('purchase_order_id', $task->purchase_order_id)
                            ->where('status', 'Approve')
                            ->count();

                        $isFinalApproval = $completedApprovals === $totalApprovals;

                        Log::info('=== PURCHASE ORDER FINAL APPROVAL CHECK ===', [
                            'task_id' => $task->id,
                            'purchase_order_id' => $task->purchase_order_id,
                            'total_approvals' => $totalApprovals,
                            'completed_approvals' => $completedApprovals,
                            'is_final_approval' => $isFinalApproval
                        ]);

                        if ($isFinalApproval) {
                            Log::info('=== FINAL PURCHASE ORDER APPROVAL - UPDATING STATUS ===', [
                                'task_id' => $task->id,
                                'purchase_order_id' => $task->purchase_order_id,
                                'current_status' => DB::table('purchase_orders')->where('id', $task->purchase_order_id)->value('status'),
                                'target_status' => 'Approved'
                            ]);

                            // Update the purchase order status to Approved
                            $purchaseOrderUpdated = DB::table('purchase_orders')
                                ->where('id', $task->purchase_order_id)
                                ->update([
                                    'status' => 'Approved',
                                    'updated_at' => now()
                                ]);

                            Log::info('=== PURCHASE ORDER STATUS UPDATE RESULT ===', [
                                'task_id' => $task->id,
                                'purchase_order_id' => $task->purchase_order_id,
                                'update_success' => $purchaseOrderUpdated,
                                'new_status' => DB::table('purchase_orders')->where('id', $task->purchase_order_id)->value('status')
                            ]);

                            // Note: Budget consumption now happens during payment processing, not PO approval
                            // PO approval only changes PO status, budget amounts remain unchanged
                            Log::info('=== PO APPROVED - BUDGET CONSUMPTION HANDLED DURING PAYMENTS ===', [
                                'task_id' => $task->id,
                                'purchase_order_id' => $task->purchase_order_id,
                                'note' => 'Budget consumption will be handled when payments are made against this PO'
                            ]);
                        } else {
                            Log::info('=== INTERMEDIATE PURCHASE ORDER APPROVAL - UPDATING TO PENDING ===', [
                                'task_id' => $task->id,
                                'purchase_order_id' => $task->purchase_order_id,
                                'total_approvals' => $totalApprovals,
                                'completed_approvals' => $completedApprovals
                            ]);

                            // Update the purchase order status to Pending for intermediate approval
                            $purchaseOrderUpdated = DB::table('purchase_orders')
                                ->where('id', $task->purchase_order_id)
                                ->update([
                                    'status' => 'Pending',
                                    'updated_at' => now()
                                ]);

                            Log::info('=== PURCHASE ORDER INTERMEDIATE STATUS UPDATE RESULT ===', [
                                'task_id' => $task->id,
                                'purchase_order_id' => $task->purchase_order_id,
                                'update_success' => $purchaseOrderUpdated,
                                'new_status' => 'Pending'
                            ]);
                        }
                    }
                } else {
                    Log::warning('=== NO APPROVAL TRANSACTION FOUND FOR PURCHASE ORDER ===', [
                        'task_id' => $task->id,
                        'purchase_order_id' => $task->purchase_order_id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);
                }
                }
            }

            // Check if this is a Purchase Order task and if it's being rejected
            if ($task->purchase_order_id && $request->input('status') === 'Rejected') {
                Log::info('=== PURCHASE ORDER TASK REJECTION CHECK ===', [
                    'task_id' => $task->id,
                    'purchase_order_id' => $task->purchase_order_id,
                    'current_status' => DB::table('purchase_orders')->where('id', $task->purchase_order_id)->value('status')
                ]);

                // Update the corresponding approval transaction
                $approvalTransaction = DB::table('po_approval_transactions')
                    ->where('purchase_order_id', $task->purchase_order_id)
                    ->where('assigned_to', $task->assigned_to_user_id)
                    ->first();

                if ($approvalTransaction) {
                    Log::info('=== UPDATING PURCHASE ORDER APPROVAL TRANSACTION FOR REJECTION ===', [
                        'task_id' => $task->id,
                        'purchase_order_id' => $task->purchase_order_id,
                        'approval_transaction_id' => $approvalTransaction->id
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('po_approval_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Reject',
                            'updated_by' => auth()->id(),
                            'updated_at' => now()
                        ]);

                    Log::info('=== PURCHASE ORDER REJECTION TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'purchase_order_id' => $task->purchase_order_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Immediately update purchase order status to Rejected
                        $purchaseOrderUpdated = DB::table('purchase_orders')
                            ->where('id', $task->purchase_order_id)
                            ->update([
                                'status' => 'Rejected',
                                'updated_at' => now()
                            ]);

                        Log::info('=== PURCHASE ORDER REJECTION STATUS UPDATE RESULT ===', [
                            'task_id' => $task->id,
                            'purchase_order_id' => $task->purchase_order_id,
                            'update_success' => $purchaseOrderUpdated,
                            'new_status' => DB::table('purchase_orders')->where('id', $task->purchase_order_id)->value('status')
                        ]);

                        // Release budget when PO is rejected
                        if ($purchaseOrderUpdated) {
                            $purchaseOrder = DB::table('purchase_orders')
                                ->where('id', $task->purchase_order_id)
                                ->first();

                            if ($purchaseOrder && $purchaseOrder->request_budget_id) {
                                // Calculate total amount including VAT for budget release
                                $baseAmount = floatval($purchaseOrder->amount ?? 0);
                                $vatAmount = floatval($purchaseOrder->vat_amount ?? 0);
                                $totalAmount = $baseAmount + $vatAmount;

                                Log::info('=== RELEASING BUDGET FOR REJECTED PO ===', [
                                    'task_id' => $task->id,
                                    'purchase_order_id' => $task->purchase_order_id,
                                    'request_budget_id' => $purchaseOrder->request_budget_id,
                                    'po_base_amount' => $baseAmount,
                                    'po_vat_amount' => $vatAmount,
                                    'po_total_amount' => $totalAmount
                                ]);

                                // Release reserved budget back to available balance (including VAT)
                                $budgetReleased = DB::table('request_budgets')
                                    ->where('id', $purchaseOrder->request_budget_id)
                                    ->update([
                                        'reserved_amount' => DB::raw('reserved_amount - ' . $totalAmount),
                                        'balance_amount' => DB::raw('balance_amount + ' . $totalAmount),
                                        'updated_at' => now()
                                    ]);

                                Log::info('=== BUDGET RELEASE RESULT ===', [
                                    'task_id' => $task->id,
                                    'purchase_order_id' => $task->purchase_order_id,
                                    'budget_release_success' => $budgetReleased,
                                    'amount_released' => $totalAmount,
                                    'base_amount' => $baseAmount,
                                    'vat_amount' => $vatAmount
                                ]);
                            }
                        }
                    }
                } else {
                    Log::warning('=== NO APPROVAL TRANSACTION FOUND FOR PURCHASE ORDER REJECTION ===', [
                        'task_id' => $task->id,
                        'purchase_order_id' => $task->purchase_order_id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);
                }
            }

            // Check if this is a Material Request task and if it's being approved or referred
            if ($task->material_request_id && in_array($request->input('status'), ['Approved', 'Referred'])) {
                Log::info('=== MATERIAL REQUEST TASK APPROVAL CHECK ===', [
                    'task_id' => $task->id,
                    'material_request_id' => $task->material_request_id,
                    'current_order_no' => $task->order_no,
                    'current_status_id' => DB::table('material_requests')->where('id', $task->material_request_id)->value('status_id'),
                    'assigned_from_user_id' => $task->assigned_from_user_id,
                    'request_status' => $request->input('status'),
                    'task_status' => $task->status
                ]);

                // Set Material Request status to 27 when task is initially approved or referred
                if (in_array($request->input('status'), ['Approved', 'Referred'])) {
                    Log::info('=== SETTING MATERIAL REQUEST STATUS TO 27 FOR INITIAL APPROVAL/REFERRAL ===', [
                        'task_id' => $task->id,
                        'material_request_id' => $task->material_request_id,
                        'status' => $request->input('status'),
                        'current_status_id' => DB::table('material_requests')->where('id', $task->material_request_id)->value('status_id'),
                        'target_status_id' => 27
                    ]);
                    
                    DB::table('material_requests')
                        ->where('id', $task->material_request_id)
                        ->update([
                            'status_id' => 27, // Pending status (different ID)
                            'updated_at' => now()
                        ]);
                    
                    Log::info('=== MATERIAL REQUEST STATUS UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'material_request_id' => $task->material_request_id,
                        'new_status_id' => DB::table('material_requests')->where('id', $task->material_request_id)->value('status_id')
                    ]);
                }

                // Check if we already handled a referral response for this material request
                // Look for a task that was created as a result of a referral response
                $referralResponseHandled = DB::table('tasks')
                    ->where('material_request_id', $task->material_request_id)
                    ->whereNotNull('assigned_from_user_id')
                    ->where('continue_approval_flow', false) // Only actual referral responses
                    ->where('created_at', '>=', now()->subMinutes(5)) // Created within last 5 minutes
                    ->exists();
                
                Log::info('=== CHECKING IF REFERRAL RESPONSE ALREADY HANDLED ===', [
                    'task_id' => $task->id,
                    'material_request_id' => $task->material_request_id,
                    'referral_response_handled' => $referralResponseHandled
                ]);

                // IMPORTANT: Proceed with normal approval flow if:
                // 1. Task should continue approval flow (continue_approval_flow == true)
                // 2. This is NOT a referral response task (assigned_from_user_id is null OR this is the original approver)
                $isReferralResponseTask = $task->assigned_from_user_id && $task->continue_approval_flow == false;
                
                if ($task->continue_approval_flow == true && !$isReferralResponseTask) {
                    Log::info('=== PROCEEDING WITH NORMAL MATERIAL REQUEST APPROVAL FLOW ===', [
                        'task_id' => $task->id,
                        'material_request_id' => $task->material_request_id,
                        'assigned_to_user_id' => $task->assigned_to_user_id,
                        'assigned_from_user_id' => $task->assigned_from_user_id,
                        'continue_approval_flow' => $task->continue_approval_flow,
                        'is_referral_response_task' => $isReferralResponseTask,
                        'note' => 'This is the original approver making the final decision'
                    ]);
                    
                    // Update the Material Request Transaction directly
                    $approvalTransaction = DB::table('material_request_transactions')
                        ->where('material_request_id', $task->material_request_id)
                        ->where('assigned_to', $task->assigned_to_user_id)
                        ->first();

                    if ($approvalTransaction) {
                        Log::info('=== UPDATING MATERIAL REQUEST TRANSACTION DIRECTLY ===', [
                            'task_id' => $task->id,
                            'material_request_id' => $task->material_request_id,
                            'approval_transaction_id' => $approvalTransaction->id,
                            'assigned_to' => $task->assigned_to_user_id
                        ]);

                        // Update the transaction status directly
                        $updateResult = DB::table('material_request_transactions')
                            ->where('id', $approvalTransaction->id)
                            ->update([
                                'status' => 'Approve',
                                'updated_at' => now()
                            ]);
                            
                        Log::info('=== MATERIAL REQUEST TRANSACTION UPDATE RESULT ===', [
                            'task_id' => $task->id,
                            'material_request_id' => $task->material_request_id,
                            'approval_transaction_id' => $approvalTransaction->id,
                            'update_result' => $updateResult
                        ]);
                        
                        // Check if this approval completes the final approval
                        // For normal approvals, we need to check if ALL required approvals are now complete
                        // This means checking if there are any remaining pending approval transactions
                        
                        $pendingApprovalTransactions = DB::table('material_request_transactions')
                            ->where('material_request_id', $task->material_request_id)
                            ->where('status', 'Pending')
                            ->count();
                            
                        $isFinalApproval = $pendingApprovalTransactions == 0;
                        
                        Log::info('=== MATERIAL REQUEST FINAL APPROVAL CHECK FOR NORMAL FLOW ===', [
                            'task_id' => $task->id,
                            'material_request_id' => $task->material_request_id,
                            'process_step_id' => $task->process_step_id,
                            'current_step_order' => DB::table('process_steps')->where('id', $task->process_step_id)->value('order'),
                            'task_order_no' => $task->order_no,
                            'pending_approval_transactions' => $pendingApprovalTransactions,
                            'is_final_approval' => $isFinalApproval,
                            'note' => 'Normal approval - final if no pending approval transactions remain'
                        ]);
                        
                        if ($isFinalApproval) {
                            Log::info('=== FINAL MATERIAL REQUEST APPROVAL - UPDATING STATUS ===', [
                                'task_id' => $task->id,
                                'material_request_id' => $task->material_request_id,
                                'current_status_id' => DB::table('material_requests')->where('id', $task->material_request_id)->value('status_id'),
                                'target_status_id' => 4 // Approved
                            ]);
                            
                            // Update Material Request status to Approved
                            $materialRequestUpdated = DB::table('material_requests')
                                ->where('id', $task->material_request_id)
                                ->update([
                                    'status_id' => 4, // Approved
                                    'updated_at' => now()
                                ]);
                            
                            Log::info('=== MATERIAL REQUEST STATUS UPDATE RESULT ===', [
                                'task_id' => $task->id,
                                'material_request_id' => $task->material_request_id,
                                'update_success' => $materialRequestUpdated,
                                'new_status_id' => DB::table('material_requests')->where('id', $task->material_request_id)->value('status_id')
                            ]);
                        }
                    } else {
                        Log::warning('=== NO APPROVAL TRANSACTION FOUND FOR MATERIAL REQUEST ===', [
                            'task_id' => $task->id,
                            'material_request_id' => $task->material_request_id,
                            'assigned_to' => $task->assigned_to_user_id
                        ]);
                    }
                } else {
                    Log::info('=== SKIPPING NORMAL MATERIAL REQUEST APPROVAL FLOW ===', [
                        'task_id' => $task->id,
                        'material_request_id' => $task->material_request_id,
                        'continue_approval_flow' => $task->continue_approval_flow,
                        'is_referral_response_task' => $isReferralResponseTask,
                        'reason' => $task->continue_approval_flow == false ? 'continue_approval_flow_is_false' : 'is_referral_response_task',
                        'assigned_from_user_id' => $task->assigned_from_user_id,
                        'note' => 'This task will be handled by referral response logic or is not meant to continue approval flow'
                    ]);
                }
            }

            // Check if this is a Material Request task and if it's being rejected
            if ($task->material_request_id && $request->input('status') === 'Rejected') {
                Log::info('=== MATERIAL REQUEST TASK REJECTION CHECK ===', [
                    'task_id' => $task->id,
                    'material_request_id' => $task->material_request_id,
                    'current_status_id' => DB::table('material_requests')->where('id', $task->material_request_id)->value('status_id')
                ]);

                // Update the corresponding approval transaction
                $approvalTransaction = DB::table('material_request_transactions')
                    ->where('material_request_id', $task->material_request_id)
                    ->where('assigned_to', $task->assigned_to_user_id)
                    ->first();

                if ($approvalTransaction) {
                    Log::info('=== UPDATING MATERIAL REQUEST APPROVAL TRANSACTION FOR REJECTION ===', [
                        'task_id' => $task->id,
                        'material_request_id' => $task->material_request_id,
                        'approval_transaction_id' => $approvalTransaction->id
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('material_request_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Reject',
                            'updated_at' => now()
                        ]);

                    Log::info('=== MATERIAL REQUEST REJECTION TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'material_request_id' => $task->material_request_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Immediately update material request status to Rejected (status_id = 3)
                        $materialRequestUpdated = DB::table('material_requests')
                            ->where('id', $task->material_request_id)
                            ->update([
                                'status_id' => 3, // Rejected
                                'updated_at' => now()
                            ]);

                        Log::info('=== MATERIAL REQUEST REJECTION STATUS UPDATE RESULT ===', [
                            'task_id' => $task->id,
                            'material_request_id' => $task->material_request_id,
                            'update_success' => $materialRequestUpdated,
                            'new_status_id' => DB::table('material_requests')->where('id', $task->material_request_id)->value('status_id')
                        ]);
                    }
                } else {
                    Log::warning('=== NO APPROVAL TRANSACTION FOUND FOR MATERIAL REQUEST REJECTION ===', [
                        'task_id' => $task->id,
                        'material_request_id' => $task->material_request_id,
                        'assigned_to' => $task->assigned_to_user_id
                    ]);
                }
            }

            // GRN approval logic is now handled by GrnApprovalTransactionController
            // TaskController calls the dedicated controller for approval flow
            if ($task->grn_id && in_array($request->input('status'), ['Approved', 'Referred'])) {
                Log::info('=== GRN TASK APPROVAL CHECK START ===', [
                    'task_id' => $task->id,
                    'grn_id' => $task->grn_id,
                    'current_order_no' => $task->order_no,
                    'current_task_status' => DB::table('grns')->where('id', $task->grn_id)->value('task_status'),
                    'current_status' => DB::table('grns')->where('id', $task->grn_id)->value('status'),
                    'process_id' => $task->process_id,
                    'assigned_to_user_id' => $task->assigned_to_user_id,
                    'assigned_from_user_id' => $task->assigned_from_user_id,
                    'request_status' => $request->input('status'),
                    'continue_approval_flow' => $task->continue_approval_flow
                ]);

                // Check if this is a referral response task
                // A referral response task is one that was created as a result of a referee responding
                // It has assigned_from_user_id (the referee) and was created after a referral
                $isReferralResponseTask = $task->assigned_from_user_id && 
                    DB::table('grn_approval_transactions')
                        ->where('grn_id', $task->grn_id)
                        ->where('assigned_to', $task->assigned_to_user_id)
                        ->whereNotNull('referred_to')
                        ->exists();
                
                Log::info('=== GRN REFERRAL RESPONSE CHECK ===', [
                    'task_id' => $task->id,
                    'grn_id' => $task->grn_id,
                    'assigned_from_user_id' => $task->assigned_from_user_id,
                    'continue_approval_flow' => $task->continue_approval_flow,
                    'is_referral_response_task' => $isReferralResponseTask
                ]);
                
                // Update the corresponding GRN approval transaction
                if ($isReferralResponseTask) {
                    // For referral response tasks, find the original approval transaction
                    // Look for a transaction that was referred to the current task's assigned_from_user_id
                    $approvalTransaction = DB::table('grn_approval_transactions')
                        ->where('grn_id', $task->grn_id)
                        ->where('assigned_to', $task->assigned_to_user_id)
                        ->where('referred_to', $task->assigned_from_user_id)
                        ->first();
                        
                    Log::info('=== REFERRAL RESPONSE TASK - LOOKING FOR ORIGINAL TRANSACTION ===', [
                        'task_id' => $task->id,
                        'grn_id' => $task->grn_id,
                        'assigned_to' => $task->assigned_to_user_id,
                        'referred_to' => $task->assigned_from_user_id,
                        'approval_transaction_found' => $approvalTransaction ? true : false,
                        'approval_transaction_id' => $approvalTransaction ? $approvalTransaction->id : null
                    ]);
                } else {
                    // For normal tasks, find the regular approval transaction
                    Log::info('=== NORMAL GRN TASK - LOOKING FOR APPROVAL TRANSACTION ===', [
                        'task_id' => $task->id,
                        'grn_id' => $task->grn_id,
                        'assigned_to' => $task->assigned_to_user_id,
                        'search_criteria' => 'grn_id=' . $task->grn_id . ' AND assigned_to=' . $task->assigned_to_user_id . ' AND referred_to IS NULL'
                    ]);
                    
                    $approvalTransaction = DB::table('grn_approval_transactions')
                        ->where('grn_id', $task->grn_id)
                        ->where('assigned_to', $task->assigned_to_user_id)
                        ->whereNull('referred_to') // Only get transactions that are NOT referrals
                        ->first();
                        
                    Log::info('=== NORMAL GRN APPROVAL TRANSACTION SEARCH RESULT ===', [
                        'task_id' => $task->id,
                        'grn_id' => $task->grn_id,
                        'approval_transaction_found' => $approvalTransaction ? true : false,
                        'approval_transaction_id' => $approvalTransaction ? $approvalTransaction->id : null,
                        'approval_transaction_order' => $approvalTransaction ? $approvalTransaction->order : null,
                        'approval_transaction_status' => $approvalTransaction ? $approvalTransaction->status : null
                    ]);
                }

                if ($approvalTransaction) {
                    Log::info('=== FOUND GRN APPROVAL TRANSACTION, UPDATING IT ===', [
                        'task_id' => $task->id,
                        'grn_id' => $task->grn_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'assigned_to' => $task->assigned_to_user_id,
                        'current_order' => $approvalTransaction->order,
                        'current_status' => $approvalTransaction->status,
                        'request_status' => $request->input('status')
                    ]);

                    // Check if this will be the final approval BEFORE updating the transaction
                    // Get the process steps to determine the total number of required approvals
                    $processSteps = DB::table('process_steps')
                        ->join('processes', 'process_steps.process_id', '=', 'processes.id')
                        ->where('processes.title', 'Short Delivery Adjustment Approval')
                        ->select('process_steps.id', 'process_steps.process_id', 'process_steps.order', 'process_steps.description', 'process_steps.approver_id', 'process_steps.designation_id')
                        ->orderBy('process_steps.order')
                        ->get();

                    $totalRequiredApprovals = $processSteps->count();
                    
                    // Check if this is the final approval (current order equals total required approvals)
                    $isFinalApproval = $approvalTransaction->order == $totalRequiredApprovals;

                    Log::info('=== GRN FINAL APPROVAL CHECK ===', [
                        'task_id' => $task->id,
                        'grn_id' => $task->grn_id,
                        'current_order' => $approvalTransaction->order,
                        'total_required_approvals' => $totalRequiredApprovals,
                        'is_final_approval' => $isFinalApproval,
                        'process_steps_count' => $processSteps->count()
                    ]);

                    // Update the approval transaction status directly (like material request)
                    $transactionUpdated = DB::table('grn_approval_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => $request->input('status') === 'Approved' ? 'Approve' : ($request->input('status') === 'Referred' ? 'Refer' : $request->input('status')),
                            'updated_at' => now()
                        ]);

                    Log::info('=== GRN APPROVAL TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'grn_id' => $task->grn_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_result' => $transactionUpdated
                    ]);

                    // IMPORTANT: Update GRN task_status to 'Pending' on first approval/referral
                    $grnTaskStatusUpdated = DB::table('grns')
                        ->where('id', $task->grn_id)
                        ->update([
                            'task_status' => 'Pending',
                            'updated_at' => now()
                        ]);

                    Log::info('=== GRN TASK STATUS UPDATED TO PENDING ===', [
                        'task_id' => $task->id,
                        'grn_id' => $task->grn_id,
                        'update_result' => $grnTaskStatusUpdated,
                        'new_task_status' => 'Pending'
                    ]);
                    
                    if ($isFinalApproval) {
                        Log::info('=== FINAL GRN APPROVAL - UPDATING TASK STATUS TO APPROVED ===', [
                            'task_id' => $task->id,
                            'grn_id' => $task->grn_id,
                            'current_status' => DB::table('grns')->where('id', $task->grn_id)->value('status'),
                            'current_task_status' => DB::table('grns')->where('id', $task->grn_id)->value('task_status'),
                            'target_task_status' => 'Approved',
                            'note' => 'Final approval - updating task_status to Approved'
                        ]);
                        
                        // Update GRN task_status to Approved (final approval)
                        $grnUpdated = DB::table('grns')
                            ->where('id', $task->grn_id)
                            ->update([
                                'task_status' => 'Approved',
                                'updated_at' => now()
                            ]);
                        
                        Log::info('=== GRN TASK STATUS UPDATE RESULT ===', [
                            'task_id' => $task->id,
                            'grn_id' => $task->grn_id,
                            'update_success' => $grnUpdated,
                            'status_unchanged' => DB::table('grns')->where('id', $task->grn_id)->value('status'),
                            'new_task_status' => DB::table('grns')->where('id', $task->grn_id)->value('task_status')
                        ]);
                    } else {
                        // NOT final approval - only create next approval step if this is an approval (not referral)
                        if ($request->input('status') === 'Approved') {
                            Log::info('=== GRN NOT FINAL APPROVAL - CREATING NEXT STEP ===', [
                                'task_id' => $task->id,
                                'grn_id' => $task->grn_id,
                                'current_order' => $approvalTransaction->order,
                                'total_required_approvals' => $totalRequiredApprovals,
                                'note' => 'Creating next approval step for approval'
                            ]);

                            // Get the next process step
                            $nextOrder = $approvalTransaction->order + 1;
                            
                            // Debug: Log all process steps
                            Log::info('=== ALL PROCESS STEPS FOR GRN ===', [
                                'task_id' => $task->id,
                                'grn_id' => $task->grn_id,
                                'process_steps_count' => $processSteps->count(),
                                'process_steps' => $processSteps->map(function($step) {
                                    return [
                                        'id' => $step->id,
                                        'process_id' => $step->process_id,
                                        'order' => $step->order,
                                        'description' => $step->description,
                                        'approver_id' => $step->approver_id
                                    ];
                                })->toArray(),
                                'next_order' => $nextOrder
                            ]);
                            
                            // Fix: Use strict comparison to avoid data type issues
                            $nextStep = $processSteps->filter(function($step) use ($nextOrder) {
                                return (int)$step->order === (int)$nextOrder;
                            })->first();
                            
                            // Debug: Log the filtering result
                            Log::info('=== PROCESS STEP FILTERING RESULT ===', [
                                'task_id' => $task->id,
                                'grn_id' => $task->grn_id,
                                'next_order' => $nextOrder,
                                'next_step_found' => $nextStep ? true : false,
                                'next_step_id' => $nextStep ? $nextStep->id : null,
                                'next_step_order' => $nextStep ? $nextStep->order : null
                            ]);

                            if ($nextStep) {
                                Log::info('=== FOUND NEXT GRN PROCESS STEP ===', [
                                    'task_id' => $task->id,
                                    'grn_id' => $task->grn_id,
                                    'next_step_id' => $nextStep->id,
                                    'next_step_order' => $nextStep->order,
                                    'next_step_description' => $nextStep->description
                                ]);

                                // Get the approver for the next step
                                $resolver = new \App\Services\ApproverResolver();
                                $eloquentStep = \App\Models\ProcessStep::find($nextStep->id);

                                if ($eloquentStep) {
                                    $nextApproverId = null;
                                    
                                    // For GRN, use the approver_id directly from the process step
                                    if (!empty($eloquentStep->approver_id)) {
                                        $nextApproverId = (int) $eloquentStep->approver_id;
                                        Log::info('=== USING EXPLICIT APPROVER_ID FROM PROCESS STEP ===', [
                                            'task_id' => $task->id,
                                            'grn_id' => $task->grn_id,
                                            'next_step_id' => $nextStep->id,
                                            'explicit_approver_id' => $nextApproverId
                                        ]);
                                    } else {
                                        // Fallback to resolver logic
                                        $requester = \App\Models\User::find(DB::table('grns')->where('id', $task->grn_id)->value('user_id'));
                                        if ($requester) {
                                            $nextApproverId = $resolver->resolveApproverId($eloquentStep, $requester);
                                        }
                                    }

                                    if ($nextApproverId) {
                                        Log::info('=== FOUND NEXT GRN APPROVER ===', [
                                            'task_id' => $task->id,
                                            'grn_id' => $task->grn_id,
                                            'next_approver_id' => $nextApproverId,
                                            'next_step_order' => $nextStep->order
                                        ]);

                                        // Check if transaction already exists for this GRN and order
                                        $existingTransaction = DB::table('grn_approval_transactions')
                                            ->where('grn_id', $task->grn_id)
                                            ->where('order', $nextOrder)
                                            ->where('assigned_to', $nextApproverId)
                                            ->first();

                                        if (!$existingTransaction) {
                                            // Create next approval transaction
                                            $nextApprovalTransactionId = DB::table('grn_approval_transactions')->insertGetId([
                                                'grn_id' => $task->grn_id,
                                                'requester_id' => DB::table('grns')->where('id', $task->grn_id)->value('user_id'),
                                                'assigned_to' => $nextApproverId,
                                                'order' => $nextStep->order,
                                                'description' => $nextStep->description,
                                                'status' => 'Pending',
                                                'created_by' => auth()->id(),
                                                'updated_by' => auth()->id(),
                                                'created_at' => now(),
                                                'updated_at' => now()
                                            ]);

                                            Log::info('=== CREATED NEXT GRN APPROVAL TRANSACTION ===', [
                                                'task_id' => $task->id,
                                                'grn_id' => $task->grn_id,
                                                'next_approval_transaction_id' => $nextApprovalTransactionId,
                                                'next_approver_id' => $nextApproverId,
                                                'next_step_order' => $nextStep->order
                                            ]);

                                            // Check if task already exists for this GRN, process step, and assigned user
                                            $existingTask = DB::table('tasks')
                                                ->where('grn_id', $task->grn_id)
                                                ->where('process_step_id', $nextStep->id)
                                                ->where('assigned_to_user_id', $nextApproverId)
                                                ->where('status', '!=', 'Completed')
                                                ->first();

                                            if (!$existingTask) {
                                                $nextTaskId = DB::table('tasks')->insertGetId([
                                                    'process_step_id' => $nextStep->id,
                                                    'process_id' => $nextStep->process_id,
                                                    'assigned_at' => now(),
                                                    'urgency' => 'Normal',
                                                    'order_no' => $nextOrder,
                                                    'assigned_to_user_id' => $nextApproverId,
                                                    'assigned_from_user_id' => DB::table('grns')->where('id', $task->grn_id)->value('user_id'),
                                                    'read_status' => null,
                                                    'grn_id' => $task->grn_id,
                                                    'created_at' => now(),
                                                    'updated_at' => now()
                                                ]);

                                                Log::info('=== CREATED NEXT GRN TASK ===', [
                                                    'task_id' => $task->id,
                                                    'grn_id' => $task->grn_id,
                                                    'next_task_id' => $nextTaskId,
                                                    'next_approver_id' => $nextApproverId,
                                                    'next_step_order' => $nextStep->order
                                                ]);

                                                // Send task assignment notification
                                                $nextTask = \App\Models\Task::with(['assignedToUser', 'process'])->find($nextTaskId);
                                                if ($nextTask) {
                                                    $nextTask->assignedToUser->notify(new \App\Notifications\TaskAssignmentNotification($nextTask, 'Short Delivery Adjustment Approval'));
                                                    Log::info('=== NEXT GRN TASK ASSIGNMENT NOTIFICATION SENT ===', [
                                                        'task_id' => $task->id,
                                                        'grn_id' => $task->grn_id,
                                                        'next_task_id' => $nextTaskId,
                                                        'next_approver_id' => $nextApproverId
                                                    ]);
                                                }
                                            } else {
                                                Log::info('=== GRN TASK ALREADY EXISTS, SKIPPING CREATION ===', [
                                                    'task_id' => $task->id,
                                                    'grn_id' => $task->grn_id,
                                                    'process_step_id' => $nextStep->id,
                                                    'assigned_to_user_id' => $nextApproverId
                                                ]);
                                            }
                                        } else {
                                            Log::info('=== GRN TRANSACTION ALREADY EXISTS, SKIPPING CREATION ===', [
                                                'task_id' => $task->id,
                                                'grn_id' => $task->grn_id,
                                                'order' => $nextOrder,
                                                'assigned_to' => $nextApproverId
                                            ]);
                                        }
                                    } else {
                                        Log::error('=== FAILED TO FIND NEXT GRN APPROVER ===', [
                                            'task_id' => $task->id,
                                            'grn_id' => $task->grn_id,
                                            'next_step_id' => $nextStep->id,
                                            'next_step_order' => $nextStep->order
                                        ]);
                                    }
                                } else {
                                    Log::error('=== FAILED TO RESOLVE NEXT GRN APPROVER - MISSING STEP OR REQUESTER ===', [
                                        'task_id' => $task->id,
                                        'grn_id' => $task->grn_id,
                                        'eloquent_step_found' => $eloquentStep ? true : false,
                                        'requester_found' => $requester ? true : false
                                    ]);
                                }
                            } else {
                                Log::warning('=== NO NEXT GRN PROCESS STEP FOUND ===', [
                                    'task_id' => $task->id,
                                    'grn_id' => $task->grn_id,
                                    'current_order' => $approvalTransaction->order,
                                    'next_order' => $nextOrder,
                                    'process_id' => $task->process_id
                                ]);
                            }
                        } else {
                            Log::info('=== GRN REFERRAL - SKIPPING NEXT STEP CREATION ===', [
                                'task_id' => $task->id,
                                'grn_id' => $task->grn_id,
                                'current_order' => $approvalTransaction->order,
                                'request_status' => $request->input('status'),
                                'note' => 'Referral - not creating next approval step'
                            ]);
                        }
                    }
                } else {
                    Log::warning('=== NO GRN APPROVAL TRANSACTION FOUND ===', [
                        'task_id' => $task->id,
                        'grn_id' => $task->grn_id,
                        'assigned_to' => $task->assigned_to_user_id,
                        'is_referral_response_task' => $isReferralResponseTask,
                        'search_criteria' => $isReferralResponseTask ? 
                            'grn_id=' . $task->grn_id . ' AND assigned_to=' . $task->assigned_to_user_id . ' AND referred_to=' . $task->assigned_from_user_id :
                            'grn_id=' . $task->grn_id . ' AND assigned_to=' . $task->assigned_to_user_id . ' AND referred_to IS NULL'
                    ]);
                    
                    // Debug: Show all GRN approval transactions for this GRN
                    $allTransactions = DB::table('grn_approval_transactions')
                        ->where('grn_id', $task->grn_id)
                        ->get();
                        
                    Log::info('=== ALL GRN APPROVAL TRANSACTIONS FOR DEBUG ===', [
                        'task_id' => $task->id,
                        'grn_id' => $task->grn_id,
                        'all_transactions' => $allTransactions->toArray()
                    ]);
                }
            }

            // Check if this is a task being referred
            if ($request->input('status') === 'Referred') {
                // Get the task description to find the referred user
                $taskDescription = TaskDescription::where('task_id', $task->id)
                    ->where('action', 'Refer')
                    ->latest()
                    ->first();

                if ($taskDescription && $taskDescription->user_id) {
                    // Create a new task for the referred user
                    $referredTask = Task::create([
                        'process_step_id' => $task->process_step_id,
                        'process_id' => $task->process_id,
                        'assigned_at' => now(),
                        'urgency' => $task->urgency,
                        'order_no' => $task->order_no,
                        'assigned_from_user_id' => $task->assigned_to_user_id, // Current approver
                        'assigned_to_user_id' => $taskDescription->user_id, // Referred user
                        'continue_approval_flow' => false, // This task should NOT continue approval flow
                        'material_request_id' => $task->material_request_id,
                        'rfq_id' => $task->rfq_id,
                        'purchase_order_id' => $task->purchase_order_id,
                        'payment_order_id' => $task->payment_order_id,
                        'invoice_id' => $task->invoice_id,
                        'budget_id' => $task->budget_id,
                        'budget_approval_transaction_id' => $task->budget_approval_transaction_id,
                        'request_budgets_id' => $task->request_budgets_id,
                        'grn_id' => $task->grn_id,
                        'status' => 'Pending',
                        'read_status' => null
                    ]);

                    Log::info('=== REFERRAL TASK CREATED ===', [
                        'original_task_id' => $task->id,
                        'referred_task_id' => $referredTask->id,
                        'referred_to_user_id' => $taskDescription->user_id,
                        'continue_approval_flow' => $referredTask->continue_approval_flow,
                        'assigned_from_user_id' => $referredTask->assigned_from_user_id,
                        'assigned_to_user_id' => $referredTask->assigned_to_user_id
                    ]);

                    // Copy task descriptions to new task
                    foreach ($task->descriptions as $desc) {
                        TaskDescription::create([
                            'task_id' => $referredTask->id,
                            'description' => $desc->description,
                            'action' => $desc->action,
                            'user_id' => $desc->user_id
                        ]);
                    }

                    // Update the approval transaction to include referred_to
                    if ($task->material_request_id) {
                        DB::table('material_request_transactions')
                            ->where('material_request_id', $task->material_request_id)
                            ->where('assigned_to', $task->assigned_to_user_id)
                            ->update([
                                'referred_to' => $taskDescription->user_id,
                                'status' => 'Refer',
                                'updated_at' => now()
                            ]);
                    } elseif ($task->rfq_id) {
                        DB::table('rfq_approval_transactions')
                            ->where('rfq_id', $task->rfq_id)
                            ->where('assigned_to', $task->assigned_to_user_id)
                            ->update([
                                'referred_to' => $taskDescription->user_id,
                                'status' => 'Refer',
                                'updated_at' => now()
                            ]);
                    } elseif ($task->purchase_order_id) {
                        DB::table('po_approval_transactions')
                            ->where('purchase_order_id', $task->purchase_order_id)
                            ->where('assigned_to', $task->assigned_to_user_id)
                            ->update([
                                'referred_to' => $taskDescription->user_id,
                                'status' => 'Refer',
                                'updated_at' => now()
                            ]);
                    } elseif ($task->invoice_id) {
                        DB::table('mahrat_invoice_approval_transactions')
                            ->where('invoice_id', $task->invoice_id)
                            ->where('assigned_to', $task->assigned_to_user_id)
                            ->update([
                                'referred_to' => $taskDescription->user_id,
                                'status' => 'Refer',
                                'updated_at' => now()
                            ]);
                    } elseif ($task->budget_id) {
                        DB::table('budget_approval_transactions')
                            ->where('budget_id', $task->budget_id)
                            ->where('assigned_to', $task->assigned_to_user_id)
                            ->update([
                                'referred_to' => $taskDescription->user_id,
                                'status' => 'Refer',
                                'updated_at' => now()
                            ]);
                    } elseif ($task->grn_id) {
                        DB::table('grn_approval_transactions')
                            ->where('grn_id', $task->grn_id)
                            ->where('assigned_to', $task->assigned_to_user_id)
                            ->update([
                                'referred_to' => $taskDescription->user_id,
                                'status' => 'Refer',
                                'updated_at' => now()
                            ]);
                    } elseif ($task->request_budgets_id) {
                        DB::table('budget_request_approval_transactions')
                            ->where('request_budgets_id', $task->request_budgets_id)
                            ->where('assigned_to', $task->assigned_to_user_id)
                            ->update([
                                'referred_to' => $taskDescription->user_id,
                                'status' => 'Refer',
                                'updated_at' => now()
                            ]);
                    }

                    // Send notification to referred user
                    $referredTask->load(['assignedToUser', 'process']);
                    if ($referredTask->assignedToUser && $referredTask->process) {
                        $notificationService = new TaskNotificationService();
                        $taskType = $notificationService->getTaskTypeFromProcess($referredTask->process->title);
                        $notificationService->sendTaskAssignmentNotification($referredTask, $taskType);
                    }

                    Log::info('=== TASK REFERRED SUCCESSFULLY ===', [
                        'original_task_id' => $task->id,
                        'referred_task_id' => $referredTask->id,
                        'referred_to_user_id' => $taskDescription->user_id
                    ]);

                    // Set the main record status to Pending when task is referred
                    if ($task->material_request_id) {
                        DB::table('material_requests')
                            ->where('id', $task->material_request_id)
                            ->update([
                                'status_id' => 27, // Pending status (different ID)
                                'updated_at' => now()
                            ]);
                    } elseif ($task->rfq_id) {
                        DB::table('rfqs')
                            ->where('id', $task->rfq_id)
                            ->update([
                                'status_id' => 48, // Pending status
                                'updated_at' => now()
                            ]);
                    } elseif ($task->purchase_order_id) {
                        DB::table('purchase_orders')
                            ->where('id', $task->purchase_order_id)
                            ->update([
                                'status' => 'Pending',
                                'updated_at' => now()
                            ]);
                    } elseif ($task->payment_order_id) {
                        DB::table('payment_orders')
                            ->where('id', $task->payment_order_id)
                            ->update([
                                'status' => 'Pending',
                                'updated_at' => now()
                            ]);
                    } elseif ($task->invoice_id) {
                        DB::table('invoices')
                            ->where('id', $task->invoice_id)
                            ->update([
                                'status' => 'Pending',
                                'updated_at' => now()
                            ]);
                    } elseif ($task->budget_id) {
                        DB::table('budgets')
                            ->where('id', $task->budget_id)
                            ->update([
                                'status' => 'Pending',
                                'updated_at' => now()
                            ]);
                    } elseif ($task->request_budgets_id) {
                        DB::table('request_budgets')
                            ->where('id', $task->request_budgets_id)
                            ->update([
                                'status' => 'Pending',
                                'updated_at' => now()
                            ]);
                    } elseif ($task->grn_id) {
                        DB::table('grns')
                            ->where('id', $task->grn_id)
                            ->update([
                                'task_status' => 'Pending',
                                'updated_at' => now()
                            ]);
                    }
                }
            }

            // === PAYMENT ORDER APPROVAL LOGIC ===
            if ($task->payment_order_id && in_array($request->input('status'), ['Approved', 'Referred'])) {
                Log::info('=== PAYMENT ORDER TASK APPROVAL CHECK ===', [
                    'task_id' => $task->id,
                    'payment_order_id' => $task->payment_order_id,
                    'current_order_no' => $task->order_no,
                    'process_id' => $task->process_id,
                    'assigned_to_user_id' => $task->assigned_to_user_id
                ]);

                // IMPORTANT: Proceed with normal approval flow if:
                // 1. Task should continue approval flow (continue_approval_flow == true)
                // 2. This is NOT a referral response task (assigned_from_user_id is null OR this is the original approver)
                $isReferralResponseTask = $task->assigned_from_user_id && $task->continue_approval_flow == false;
                
                if ($task->continue_approval_flow == true && !$isReferralResponseTask) {
                    Log::info('=== PROCEEDING WITH NORMAL PAYMENT ORDER APPROVAL FLOW ===', [
                        'task_id' => $task->id,
                        'payment_order_id' => $task->payment_order_id,
                        'assigned_to_user_id' => $task->assigned_to_user_id,
                        'assigned_from_user_id' => $task->assigned_from_user_id,
                        'continue_approval_flow' => $task->continue_approval_flow,
                        'is_referral_response_task' => $isReferralResponseTask,
                        'note' => 'This is the original approver making the final decision'
                    ]);
                    // Get total number of required approvals for this payment order
                    $totalApprovals = DB::table('tasks')
                    ->where('payment_order_id', $task->payment_order_id)
                    ->where('process_id', $task->process_id)
                    ->count();

                // Get all tasks for this payment order to verify
                $allTasks = DB::table('tasks')
                    ->where('payment_order_id', $task->payment_order_id)
                    ->where('process_id', $task->process_id)
                    ->get();

                // Check if this is the final approval
                $isFinalApproval = (string)$task->order_no === (string)$totalApprovals;

                $paymentOrder = \App\Models\PaymentOrder::find($task->payment_order_id);
                if (!$paymentOrder) {
                    Log::error('=== PAYMENT ORDER NOT FOUND FOR APPROVAL ===', [
                        'payment_order_id' => $task->payment_order_id
                    ]);
                } else {
                    if ($isFinalApproval) {
                        // Final approver logic
                        $today = now();
                        $dueDate = $paymentOrder->due_date;
                        if ($dueDate && $dueDate->lt($today)) {
                            $paymentOrder->status = 'Overdue';
                        } else {
                            $paymentOrder->status = 'Approved';
                        }
                        $paymentOrder->save();
                        Log::info('=== FINAL PAYMENT ORDER APPROVAL - STATUS UPDATED (NEW LOGIC) ===', [
                            'payment_order_id' => $paymentOrder->id,
                            'new_status' => $paymentOrder->status
                        ]);
                    } else {
                        // First approver (not final)
                        $paymentOrder->status = 'Pending';
                        $paymentOrder->save();
                        Log::info('=== INTERMEDIATE PAYMENT ORDER APPROVAL - STATUS SET TO PENDING ===', [
                            'payment_order_id' => $paymentOrder->id
                        ]);
                    }
                }
            }

            // If any approver rejects, set status to Cancelled
            if ($task->payment_order_id && $request->input('status') === 'Rejected') {
                $paymentOrder = \App\Models\PaymentOrder::find($task->payment_order_id);
                if ($paymentOrder) {
                    $paymentOrder->status = 'Cancelled';
                    $paymentOrder->save();
                    Log::info('=== PAYMENT ORDER REJECTED - STATUS SET TO CANCELLED ===', [
                        'payment_order_id' => $paymentOrder->id
                    ]);
                }
                }
            }

            // Check if this is a GRN task and if it's being rejected
            if ($task->grn_id && $request->input('status') === 'Rejected') {
                Log::info('=== GRN TASK REJECTION CHECK ===', [
                    'task_id' => $task->id,
                    'grn_id' => $task->grn_id,
                ]);

                // Update the corresponding approval transaction
                $approvalTransaction = DB::table('grn_approval_transactions')
                    ->where('grn_id', $task->grn_id)
                    ->where('assigned_to', $task->assigned_to_user_id)
                    ->first();

                if ($approvalTransaction) {
                    Log::info('=== UPDATING GRN APPROVAL TRANSACTION FOR REJECTION ===', [
                        'task_id' => $task->id,
                        'grn_id' => $task->grn_id,
                        'approval_transaction_id' => $approvalTransaction->id
                    ]);

                    // Update the approval transaction status
                    $transactionUpdated = DB::table('grn_approval_transactions')
                        ->where('id', $approvalTransaction->id)
                        ->update([
                            'status' => 'Reject',
                            'updated_by' => auth()->id(),
                            'updated_at' => now()
                        ]);

                    Log::info('=== GRN REJECTION TRANSACTION UPDATE RESULT ===', [
                        'task_id' => $task->id,
                        'grn_id' => $task->grn_id,
                        'approval_transaction_id' => $approvalTransaction->id,
                        'update_success' => $transactionUpdated
                    ]);

                    if ($transactionUpdated) {
                        // Update GRN task_status to Rejected
                        DB::table('grns')
                            ->where('id', $task->grn_id)
                            ->update([
                                'task_status' => 'Rejected',
                                'updated_at' => now()
                            ]);

                        Log::info('=== GRN REJECTION - TASK_STATUS UPDATED TO REJECTED ===', [
                            'task_id' => $task->id,
                            'grn_id' => $task->grn_id,
                            'new_task_status' => 'Rejected'
                        ]);

                        // Revert the PO status to partially_delivered since adjustment was rejected
                        DB::table('purchase_orders')
                            ->where('id', DB::table('grns')->where('id', $task->grn_id)->value('purchase_order_id'))
                            ->update([
                                'delivery_status' => 'partially_delivered',
                                'has_good_receive_note' => false,
                                'updated_at' => now()
                            ]);

                        Log::info('=== GRN REJECTION - PO STATUS REVERTED ===', [
                            'task_id' => $task->id,
                            'grn_id' => $task->grn_id,
                        ]);
                    }
                }
            }

            // Send status notification to requester if task status changed
            // Skip general notification logic for budget approval tasks since we have specific logic for them
            if ($request->has('status') && in_array($request->input('status'), ['Approved', 'Rejected']) && !$task->budget_id) {
                try {
                    $notificationService = new TaskNotificationService();
                    $taskType = $notificationService->getTaskTypeFromProcess($task->process->title ?? '');
                    $requester = $notificationService->getRequesterFromTask($task);
                    
                    if ($requester) {
                        $comment = $request->input('comment') ?? null;
                        
                        // For rejections, always send notification immediately
                        if ($request->input('status') === 'Rejected') {
                            $notificationService->sendFinalStatusNotification($task, $taskType, 'Rejected', $requester, $comment);
                            
                            Log::info('Rejection notification sent to requester', [
                                'task_id' => $task->id,
                                'task_type' => $taskType,
                                'requester_id' => $requester->id,
                                'requester_email' => $requester->email
                            ]);
                        } else {
                            // For approvals, check if this is the final approval
                            $isFinalApproval = $this->isFinalApproval($task);
                            
                            if ($isFinalApproval) {
                                // Send final approval notification only on final approval
                                $notificationService->sendFinalStatusNotification($task, $taskType, 'Approved', $requester, $comment);
                                
                                Log::info('Final approval notification sent to requester', [
                                    'task_id' => $task->id,
                                    'task_type' => $taskType,
                                    'requester_id' => $requester->id,
                                    'requester_email' => $requester->email
                                ]);
                            } else {
                                // Send intermediate status notification for non-final approvals
                                $notificationService->sendIntermediateStatusNotification($task, $taskType, 'Approved', $requester, $comment);
                                
                                Log::info('Intermediate approval notification sent to requester', [
                                    'task_id' => $task->id,
                                    'task_type' => $taskType,
                                    'requester_id' => $requester->id,
                                    'requester_email' => $requester->email
                                ]);
                            }
                        }
                    } else {
                        Log::warning('Could not find requester for task status notification', [
                            'task_id' => $task->id,
                            'task_type' => $taskType,
                            'status' => $request->input('status')
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::error('Failed to send status notification', [
                        'task_id' => $task->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            DB::commit();

            Log::info('=== TASK UPDATE COMPLETED ===', [
                'task_id' => $task->id,
                'rfq_id' => $task->rfq_id,
                'final_status_id' => $task->rfq ? $task->rfq->status_id : null
            ]);

            return response()->json([
                'message' => 'Task updated successfully',
                'data' => new TaskResource($task->load([
                    'processStep',
                    'process',
                    'assignedUser',
                    'descriptions',
                    'material_request',
                    'rfq',
                    'purchase_order',
                    'payment_order',
                    'invoice',
                    'budget',
                    'budget_approval_transaction',
                    'request_budget',
                ]))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('=== TASK UPDATE FAILED ===', [
                'task_id' => $task->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to update task',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Check if this is the final approval for the task
     */
    private function isFinalApproval(Task $task): bool
    {
        // Get the process title to determine the correct process
        $processTitle = $task->process->title ?? '';
        
        // Get total number of required approvals from process steps
        $totalRequiredApprovals = DB::table('process_steps')
            ->join('processes', 'process_steps.process_id', '=', 'processes.id')
            ->where('processes.title', $processTitle)
            ->count();

        // Check if current task order equals total required approvals
        $isFinal = (string)$task->order_no === (string)$totalRequiredApprovals;
        
        Log::info('=== FINAL APPROVAL CHECK ===', [
            'task_id' => $task->id,
            'process_title' => $processTitle,
            'current_order_no' => $task->order_no,
            'total_required_approvals' => $totalRequiredApprovals,
            'is_final_approval' => $isFinal,
            'comparison' => [
                'order_no_string' => (string)$task->order_no,
                'total_approvals_string' => (string)$totalRequiredApprovals,
                'strict_comparison' => $task->order_no === $totalRequiredApprovals,
                'loose_comparison' => $task->order_no == $totalRequiredApprovals
            ]
        ]);

        return $isFinal;
    }

    /**
     * Get the foreign key name for the task
     */
    private function getTaskForeignKey(Task $task): string
    {
        if ($task->material_request_id) return 'material_request_id';
        if ($task->rfq_id) return 'rfq_id';
        if ($task->purchase_order_id) return 'purchase_order_id';
        if ($task->payment_order_id) return 'payment_order_id';
        if ($task->invoice_id) return 'invoice_id';
        if ($task->request_budgets_id) return 'request_budgets_id';
        if ($task->budget_id) return 'budget_id';
        if ($task->grn_id) return 'grn_id';
        
        return 'id'; // fallback
    }

    /**
     * Get the approver for a GRN process step
     */
    private function getApproverForGrnStep($step, int $grnId): ?int
    {
        try {
            // Get the requester ID from the GRN
            $requesterId = DB::table('grns')->where('id', $grnId)->value('user_id');
            
            if (!$requesterId) {
                Log::error('=== NO REQUESTER FOUND FOR GRN ===', [
                    'grn_id' => $grnId,
                    'step_id' => $step->id
                ]);
                return null;
            }

            // If step has a specific approver_id, use it
            if ($step->approver_id) {
                return $step->approver_id;
            }

            // If step has a designation_id, find user with that designation
            if ($step->designation_id) {
                $designation = DB::table('designations')->where('id', $step->designation_id)->first();
                if ($designation) {
                    // For Direct Manager designation, find the requester's direct manager
                    if (strcasecmp(trim($designation->designation), 'Direct Manager') === 0) {
                        $requester = DB::table('users')->where('id', $requesterId)->first();
                        return $requester?->parent_id;
                    }
                    
                    // For other designations, find the first user with that designation
                    $user = DB::table('users')
                        ->where('designation_id', $step->designation_id)
                        ->where('is_active', true)
                        ->first();
                    return $user?->id;
                }
            }

            return null;
        } catch (\Exception $e) {
            Log::error('=== FAILED TO GET APPROVER FOR GRN STEP ===', [
                'step_id' => $step->id,
                'grn_id' => $grnId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Get the foreign key value for the task
     */
    private function getTaskForeignKeyValue(Task $task): int
    {
        return $task->material_request_id ?? 
               $task->rfq_id ?? 
               $task->purchase_order_id ?? 
               $task->payment_order_id ?? 
               $task->invoice_id ?? 
               $task->request_budgets_id ?? 
               $task->budget_id ?? 
               $task->id;
    }

    /**
     * Handle RFQ approval transaction update logic (simplified like Material Request)
     */
    private function handleRfqApprovalTransactionUpdate($rfqApprovalTransaction)
    {
        try {
            Log::info('=== HANDLING RFQ APPROVAL TRANSACTION UPDATE (SIMPLIFIED) ===', [
                'transaction_id' => $rfqApprovalTransaction->id,
                'rfq_id' => $rfqApprovalTransaction->rfq_id,
                'order' => $rfqApprovalTransaction->order,
                'status' => $rfqApprovalTransaction->status
            ]);

            // If the status is 'Approve', check if this is the final approval
            if ($rfqApprovalTransaction->status === 'Approve') {
                Log::info('=== RFQ APPROVAL TRANSACTION STATUS IS APPROVE ===', [
                    'transaction_id' => $rfqApprovalTransaction->id,
                    'rfq_id' => $rfqApprovalTransaction->rfq_id,
                    'order' => $rfqApprovalTransaction->order,
                    'status' => $rfqApprovalTransaction->status
                ]);

                $processSteps = DB::table('process_steps')
                    ->join('processes', 'process_steps.process_id', '=', 'processes.id')
                    ->where('processes.title', 'RFQ Approval')
                    ->orderBy('process_steps.order')
                    ->get();
                $totalRequiredApprovals = $processSteps->count();
                $isFinalApproval = $rfqApprovalTransaction->order == $totalRequiredApprovals;

                Log::info('=== RFQ APPROVAL FINAL CHECK (SIMPLIFIED) ===', [
                    'transaction_id' => $rfqApprovalTransaction->id,
                    'current_order' => $rfqApprovalTransaction->order,
                    'total_required_approvals' => $totalRequiredApprovals,
                    'is_final_approval' => $isFinalApproval,
                    'process_steps_found' => $processSteps->count(),
                    'process_steps' => $processSteps->toArray()
                ]);

                if (!$isFinalApproval) {
                    $nextOrder = $rfqApprovalTransaction->order + 1;
                    $nextStep = $processSteps->where('order', $nextOrder)->first();
                    
                    Log::info('=== CREATING NEXT RFQ APPROVAL TRANSACTION (SIMPLIFIED) ===', [
                        'transaction_id' => $rfqApprovalTransaction->id,
                        'rfq_id' => $rfqApprovalTransaction->rfq_id,
                        'current_order' => $rfqApprovalTransaction->order,
                        'next_order' => $nextOrder,
                        'next_step_id' => $nextStep ? $nextStep->id : null
                    ]);

                    if ($nextStep) {
                        Log::info('=== NEXT STEP FOUND ===', [
                            'transaction_id' => $rfqApprovalTransaction->id,
                            'next_step_id' => $nextStep->id,
                            'next_step_order' => $nextStep->order,
                            'next_step_description' => $nextStep->description
                        ]);

                        $resolver = new \App\Services\ApproverResolver();
                        $eloquentStep = \App\Models\ProcessStep::find($nextStep->id);
                        $requester = \App\Models\User::find($rfqApprovalTransaction->requester_id);
                        
                        Log::info('=== APPROVER RESOLVER INPUTS ===', [
                            'transaction_id' => $rfqApprovalTransaction->id,
                            'eloquent_step_found' => $eloquentStep ? true : false,
                            'eloquent_step_id' => $eloquentStep ? $eloquentStep->id : null,
                            'requester_found' => $requester ? true : false,
                            'requester_id' => $requester ? $requester->id : null,
                            'requester_name' => $requester ? $requester->name : null
                        ]);

                        if ($eloquentStep && $requester) {
                            Log::info('=== CALLING APPROVER RESOLVER ===', [
                                'transaction_id' => $rfqApprovalTransaction->id,
                                'step_id' => $eloquentStep->id,
                                'step_approver_id' => $eloquentStep->approver_id,
                                'step_designation_id' => $eloquentStep->designation_id,
                                'requester_id' => $requester->id,
                                'requester_parent_id' => $requester->parent_id,
                                'requester_designation_id' => $requester->designation_id
                            ]);
                            
                            $resolvedApproverId = $resolver->resolveApproverId($eloquentStep, $requester);
                            
                            Log::info('=== APPROVER RESOLVER RESULT ===', [
                                'transaction_id' => $rfqApprovalTransaction->id,
                                'resolved_approver_id' => $resolvedApproverId
                            ]);
                        } else {
                            $resolvedApproverId = null;
                            Log::warning('=== CANNOT CALL APPROVER RESOLVER ===', [
                                'transaction_id' => $rfqApprovalTransaction->id,
                                'eloquent_step_found' => $eloquentStep ? true : false,
                                'requester_found' => $requester ? true : false
                            ]);
                        }

                        Log::info('=== RESOLVED NEXT APPROVER (SIMPLIFIED) ===', [
                            'transaction_id' => $rfqApprovalTransaction->id,
                            'next_step_id' => $nextStep->id,
                            'resolved_approver_id' => $resolvedApproverId,
                            'requester_id' => $rfqApprovalTransaction->requester_id
                        ]);

                        if ($resolvedApproverId) {
                            // Check if transaction already exists for this RFQ and order
                            $existingTransaction = \App\Models\RfqApprovalTransaction::where('rfq_id', $rfqApprovalTransaction->rfq_id)
                                ->where('order', $nextOrder)
                                ->where('assigned_to', $resolvedApproverId)
                                ->first();
                            
                            if (!$existingTransaction) {
                                $nextTransaction = new \App\Models\RfqApprovalTransaction([
                                    'rfq_id' => $rfqApprovalTransaction->rfq_id,
                                    'requester_id' => $rfqApprovalTransaction->requester_id,
                                    'assigned_to' => $resolvedApproverId,
                                    'order' => $nextOrder,
                                    'description' => $nextStep->description,
                                    'status' => 'Pending',
                                    'created_by' => auth()->id(),
                                    'updated_by' => auth()->id()
                                ]);
                                $nextTransaction->save();

                                // Check if task already exists for this RFQ, process step, and assigned user
                                $existingTask = DB::table('tasks')
                                    ->where('rfq_id', $rfqApprovalTransaction->rfq_id)
                                    ->where('process_step_id', $nextStep->id)
                                    ->where('assigned_to_user_id', $resolvedApproverId)
                                    ->where('status', '!=', 'Completed')
                                    ->first();
                                
                                if (!$existingTask) {
                                    $taskId = DB::table('tasks')->insertGetId([
                                        'process_step_id' => $nextStep->id,
                                        'process_id' => $nextStep->process_id,
                                        'assigned_at' => now(),
                                        'urgency' => 'Normal',
                                        'order_no' => $nextOrder,
                                        'assigned_to_user_id' => $resolvedApproverId,
                                        'assigned_from_user_id' => $rfqApprovalTransaction->requester_id,
                                        'read_status' => null,
                                        'rfq_id' => $rfqApprovalTransaction->rfq_id,
                                        'created_at' => now(),
                                        'updated_at' => now()
                                    ]);

                                    Log::info('=== NEXT RFQ TASK CREATED (SIMPLIFIED) ===', [
                                        'transaction_id' => $rfqApprovalTransaction->id,
                                        'next_transaction_id' => $nextTransaction->id,
                                        'next_task_id' => $taskId,
                                        'assigned_to' => $resolvedApproverId
                                    ]);

                                    // Send task assignment notification
                                    $task = \App\Models\Task::with(['assignedToUser', 'process'])->find($taskId);
                                    if ($task) {
                                        $notificationService = new \App\Services\TaskNotificationService();
                                        $notificationService->sendTaskAssignmentNotification($task, 'RFQ Approval');
                                    }
                                } else {
                                    Log::info('=== RFQ TASK ALREADY EXISTS ===', [
                                        'transaction_id' => $rfqApprovalTransaction->id,
                                        'existing_task_id' => $existingTask->id,
                                        'assigned_to' => $resolvedApproverId
                                    ]);
                                }
                            } else {
                                Log::info('=== RFQ TRANSACTION ALREADY EXISTS ===', [
                                    'transaction_id' => $rfqApprovalTransaction->id,
                                    'existing_transaction_id' => $existingTransaction->id,
                                    'assigned_to' => $resolvedApproverId
                                ]);
                            }
                        } else {
                            Log::warning('=== NO APPROVER RESOLVED FOR NEXT STEP ===', [
                                'transaction_id' => $rfqApprovalTransaction->id,
                                'next_step_id' => $nextStep->id
                            ]);
                        }
                    } else {
                        Log::warning('=== NO NEXT STEP FOUND ===', [
                            'transaction_id' => $rfqApprovalTransaction->id,
                            'next_order' => $nextOrder
                        ]);
                    }
                } else {
                    Log::info('=== FINAL RFQ APPROVAL - NO NEXT TASK NEEDED ===', [
                        'transaction_id' => $rfqApprovalTransaction->id,
                        'rfq_id' => $rfqApprovalTransaction->rfq_id
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error('=== ERROR IN RFQ APPROVAL TRANSACTION UPDATE ===', [
                'transaction_id' => $rfqApprovalTransaction->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    public function destroy(Task $task): JsonResponse
    {
        try {
            DB::beginTransaction();

            $task->delete();

            DB::commit();

            return response()->json([
                'message' => 'Task deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to delete task',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function markAsRead(Task $task): JsonResponse
    {
        try {
            $task->update(['read_status' => now()]);

            return response()->json([
                'message' => 'Task marked as read',
                'data' => new TaskResource($task)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to mark task as read',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function getByUrgency(string $urgency): JsonResponse
    {
        $tasks = QueryBuilder::for(Task::class)
            ->where('urgency', $urgency)
            ->allowedIncludes(TaskParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($tasks->isEmpty()) {
            return response()->json([
                'message' => "No tasks found with urgency: {$urgency}",
                'data' => []
            ], Response::HTTP_OK);
        }

        return response()->json(new TaskCollection($tasks), Response::HTTP_OK);
    }
}
