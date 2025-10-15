<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\PaymentOrderApprovalTransaction\StorePaymentOrderApprovalTransactionRequest;
use App\Http\Requests\V1\PaymentOrderApprovalTransaction\UpdatePaymentOrderApprovalTransactionRequest;
use App\Http\Resources\V1\PaymentOrderApprovalTransactionResource;
use App\Models\PaymentOrderApprovalTransaction;
use App\Models\Task;
use App\QueryParameters\PaymentOrderApprovalTransactionParameters;
use App\Services\TaskNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Support\Facades\Log;
use App\Models\ProcessStep as EloquentProcessStep;
use App\Models\User;
use App\Services\ApproverResolver;

class PaymentOrderApprovalTransactionController extends Controller
{
    /**
     * Display a listing of the payment order approval transactions.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $transactions = QueryBuilder::for(PaymentOrderApprovalTransaction::class)
            ->allowedFilters(PaymentOrderApprovalTransactionParameters::ALLOWED_FILTERS)
            ->allowedSorts(PaymentOrderApprovalTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(PaymentOrderApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No payment order approval transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return PaymentOrderApprovalTransactionResource::collection($transactions);
    }

    /**
     * Store a newly created payment order approval transaction.
     */
    public function store(StorePaymentOrderApprovalTransactionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();

            // Automatically add current user as creator and updater
            $data['created_by'] = auth()->id();
            $data['updated_by'] = auth()->id();

            $transaction = PaymentOrderApprovalTransaction::create($data);

            DB::commit();

            return response()->json([
                'message' => 'Payment order approval transaction created successfully',
                'data' => new PaymentOrderApprovalTransactionResource(
                    $transaction->load([
                        'paymentOrder',
                        'requester',
                        'assignedUser',
                        'referredUser',
                        'createdByUser',
                        'updatedByUser'
                    ])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create payment order approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified payment order approval transaction.
     */
    public function show(string $id): JsonResponse
    {
        $transaction = QueryBuilder::for(PaymentOrderApprovalTransaction::class)
            ->allowedIncludes(PaymentOrderApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new PaymentOrderApprovalTransactionResource($transaction)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified payment order approval transaction.
     */
    public function update(UpdatePaymentOrderApprovalTransactionRequest $request, PaymentOrderApprovalTransaction $paymentOrderApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();

            // Automatically add current user as updater
            $data['updated_by'] = auth()->id();

            $paymentOrderApprovalTransaction->update($data);

            // Log referee response for debugging
            Log::info('=== PAYMENT ORDER APPROVAL TRANSACTION UPDATED ===', [
                'transaction_id' => $paymentOrderApprovalTransaction->id,
                'payment_order_id' => $paymentOrderApprovalTransaction->payment_order_id,
                'assigned_to' => $paymentOrderApprovalTransaction->assigned_to,
                'new_status' => $data['status'],
                'updated_by' => auth()->id(),
                'updated_at' => now()
            ]);

            // If the status is 'Approve' or 'Referred', check if this is the final approval
            if (isset($data['status']) && in_array($data['status'], ['Approve', 'Referred'])) {
                
                // IMPORTANT: Check if this task should continue approval flow
                // Look for the corresponding task to check continue_approval_flow
                $correspondingTask = DB::table('tasks')
                    ->where('payment_order_id', $paymentOrderApprovalTransaction->payment_order_id)
                    ->where('assigned_to_user_id', $paymentOrderApprovalTransaction->assigned_to)
                    ->where('status', '!=', 'Completed')
                    ->first();
                
                Log::info('=== PAYMENT ORDER APPROVAL TRANSACTION - TASK CHECK ===', [
                    'transaction_id' => $paymentOrderApprovalTransaction->id,
                    'payment_order_id' => $paymentOrderApprovalTransaction->payment_order_id,
                    'assigned_to' => $paymentOrderApprovalTransaction->assigned_to,
                    'corresponding_task_found' => $correspondingTask ? true : false,
                    'corresponding_task_id' => $correspondingTask ? $correspondingTask->id : null,
                    'continue_approval_flow' => $correspondingTask ? $correspondingTask->continue_approval_flow : null,
                    'continue_approval_flow_true_check' => $correspondingTask ? ($correspondingTask->continue_approval_flow == true) : false,
                    'continue_approval_flow_one_check' => $correspondingTask ? ($correspondingTask->continue_approval_flow == 1) : false,
                    'status' => $data['status']
                ]);
                
                // If task exists and should not continue approval flow, skip normal approval logic
                if ($correspondingTask && $correspondingTask->continue_approval_flow != true) {
                    Log::info('=== SKIPPING PAYMENT ORDER APPROVAL FLOW - continue_approval_flow is not true ===', [
                        'transaction_id' => $paymentOrderApprovalTransaction->id,
                        'payment_order_id' => $paymentOrderApprovalTransaction->payment_order_id,
                        'task_id' => $correspondingTask->id,
                        'continue_approval_flow' => $correspondingTask->continue_approval_flow,
                        'status' => $data['status'],
                        'reason' => 'Task should not continue approval flow'
                    ]);
                    
                    DB::commit();
                    return response()->json([
                        'message' => 'Payment order approval transaction updated successfully (no next step)',
                        'data' => new PaymentOrderApprovalTransactionResource(
                            $paymentOrderApprovalTransaction->load([
                                'paymentOrder',
                                'requester',
                                'assignedUser',
                                'referredUser',
                                'createdByUser',
                                'updatedByUser'
                            ])
                        )
                    ], Response::HTTP_OK);
                }
                
                // Update payment order status based on the action
                if ($data['status'] === 'Referred') {
                    // Payment Order status ENUM: ['Draft', 'Approved','Overdue', 'Cancelled','Paid', 'Pending', 'Partially Paid']
                    // "Referred" is not a valid status, so keep it as 'Pending' for referrals
                    Log::info('=== PAYMENT ORDER REFERRED - KEEPING STATUS AS PENDING ===', [
                        'payment_order_id' => $paymentOrderApprovalTransaction->payment_order_id,
                        'current_status' => DB::table('payment_orders')->where('id', $paymentOrderApprovalTransaction->payment_order_id)->value('status'),
                        'target_status' => 'Pending (Referred task)',
                        'note' => 'Payment Order status remains Pending when task is referred'
                    ]);
                    
                    // Don't update Payment Order status for referrals - keep it as Pending
                    // The referral information is tracked in the approval transaction and task
                    
                    Log::info('=== PAYMENT ORDER REFERRAL HANDLED ===', [
                        'payment_order_id' => $paymentOrderApprovalTransaction->payment_order_id,
                        'current_status' => DB::table('payment_orders')->where('id', $paymentOrderApprovalTransaction->payment_order_id)->value('status'),
                        'note' => 'Payment Order status unchanged - referral tracked in transaction and task'
                    ]);
                }
                // Check if this is a referral response task - if so, skip normal approval flow
                // Look for a task that was created as a result of a referral response
                $referralResponseTask = DB::table('tasks')
                    ->where('payment_order_id', $paymentOrderApprovalTransaction->payment_order_id)
                    ->where('assigned_to_user_id', $paymentOrderApprovalTransaction->assigned_to)
                    ->whereNotNull('assigned_from_user_id')
                    ->where('created_at', '>=', now()->subMinutes(5)) // Created within last 5 minutes
                    ->first();
                
                if ($referralResponseTask) {
                    Log::info('=== SKIPPING PAYMENT ORDER APPROVAL FLOW - THIS IS A REFERRAL RESPONSE ===', [
                        'payment_order_id' => $paymentOrderApprovalTransaction->payment_order_id,
                        'task_id' => $referralResponseTask->id,
                        'assigned_from_user_id' => $referralResponseTask->assigned_from_user_id,
                        'assigned_to_user_id' => $referralResponseTask->assigned_to_user_id,
                        'task_created_at' => $referralResponseTask->created_at
                    ]);
                    DB::commit();
                    return response()->json([
                        'message' => 'Payment order approval transaction updated successfully (referral response)',
                        'data' => new PaymentOrderApprovalTransactionResource(
                            $paymentOrderApprovalTransaction->load([
                                'paymentOrder',
                                'requester',
                                'assignedUser',
                                'referredUser',
                                'createdByUser',
                                'updatedByUser'
                            ])
                        )
                    ], Response::HTTP_OK);
                }
                
                // Check if this is a referrer approving after a referral response
                // Look for a task that was created as a result of this user referring to someone else
                $referrerTask = DB::table('tasks')
                    ->where('payment_order_id', $paymentOrderApprovalTransaction->payment_order_id)
                    ->where('assigned_from_user_id', $paymentOrderApprovalTransaction->assigned_to)
                    ->whereNotNull('assigned_to_user_id')
                    ->where('created_at', '>=', now()->subMinutes(10)) // Created within last 10 minutes
                    ->first();
                
                if ($referrerTask && $data['status'] === 'Approve') {
                    Log::info('=== REFERRER APPROVING AFTER REFERRAL RESPONSE (PAYMENT ORDER) ===', [
                        'payment_order_id' => $paymentOrderApprovalTransaction->payment_order_id,
                        'referrer_task_id' => $referrerTask->id,
                        'referrer_user_id' => $paymentOrderApprovalTransaction->assigned_to,
                        'referee_user_id' => $referrerTask->assigned_to_user_id,
                        'status' => $data['status']
                    ]);
                    
                    // Force the status to Approve for the rest of the flow
                    $data['status'] = 'Approve';
                    
                    // Continue with normal approval flow
                    Log::info('=== CONTINUING WITH NORMAL PAYMENT ORDER APPROVAL FLOW AFTER REFERRAL ===', [
                        'payment_order_id' => $paymentOrderApprovalTransaction->payment_order_id,
                        'transaction_id' => $paymentOrderApprovalTransaction->id,
                        'order' => $paymentOrderApprovalTransaction->order
                    ]);
                }
                
                $processSteps = DB::table('process_steps')
                    ->join('processes', 'process_steps.process_id', '=', 'processes.id')
                    ->where('processes.title', 'Payment Order Approval')
                    ->orderBy('process_steps.order')
                    ->get();
                $totalRequiredApprovals = $processSteps->count();
                $currentStep = $processSteps->where('order', $paymentOrderApprovalTransaction->order)->first();
                $eloquentCurrentStep = $currentStep ? EloquentProcessStep::find($currentStep->id) : null;
                $isDirectManagerFlow = $eloquentCurrentStep && $eloquentCurrentStep->designation && strcasecmp(trim($eloquentCurrentStep->designation->designation), 'Direct Manager') === 0;
                $currentApprover = User::find($paymentOrderApprovalTransaction->assigned_to);
                $isFinalApproval = $isDirectManagerFlow
                    ? ($currentApprover?->parent_id ? false : true)
                    : ($paymentOrderApprovalTransaction->order == $totalRequiredApprovals);
                if (!$isFinalApproval) {
                    $nextOrder = $paymentOrderApprovalTransaction->order + 1;
                    $nextStep = $processSteps->where('order', $nextOrder)->first();
                    if ($isDirectManagerFlow) {
                        $stepIdForTask = $nextStep->id ?? ($currentStep->id ?? null);
                        $resolvedApproverId = $currentApprover?->parent_id;
                        if ($resolvedApproverId && $stepIdForTask) {
                            $nextTransaction = new 
                                \App\Models\PaymentOrderApprovalTransaction([
                                    'payment_order_id' => $paymentOrderApprovalTransaction->payment_order_id,
                                    'requester_id' => $paymentOrderApprovalTransaction->requester_id,
                                    'assigned_to' => $resolvedApproverId,
                                    'order' => $nextOrder,
                                    'description' => $nextStep->description ?? ($eloquentCurrentStep?->description),
                                    'status' => 'Pending',
                                    'created_by' => auth()->id(),
                                    'updated_by' => auth()->id()
                                ]);
                            $nextTransaction->save();
                            $taskId = DB::table('tasks')->insertGetId([
                                'process_step_id' => $stepIdForTask,
                                'process_id' => $nextStep->process_id ?? ($eloquentCurrentStep?->process_id),
                                'assigned_at' => now(),
                                'urgency' => 'Normal',
                                'order_no' => $nextOrder,
                                'assigned_to_user_id' => $resolvedApproverId,
                                'assigned_from_user_id' => $paymentOrderApprovalTransaction->requester_id,
                                'read_status' => null,
                                'payment_order_id' => $paymentOrderApprovalTransaction->payment_order_id,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]);
                        }
                    } elseif ($nextStep) {
                        $resolver = new ApproverResolver();
                        $eloquentStep = EloquentProcessStep::find($nextStep->id);
                        $requester = User::find($paymentOrderApprovalTransaction->requester_id);
                        $resolvedApproverId = null;
                        if ($eloquentStep && $eloquentStep->designation && strcasecmp(trim($eloquentStep->designation->designation), 'Direct Manager') === 0) {
                            $currentApprover = User::find($paymentOrderApprovalTransaction->assigned_to);
                            // If current approver has no parent (is head), they approve their own requests
                            $resolvedApproverId = $currentApprover?->parent_id ?: $currentApprover?->id;
                        } else {
                            $resolvedApproverId = $eloquentStep && $requester
                                ? $resolver->resolveApproverId($eloquentStep, $requester)
                                : null;
                        }
                        if ($resolvedApproverId) {
                            $nextTransaction = new 
                                \App\Models\PaymentOrderApprovalTransaction([
                                    'payment_order_id' => $paymentOrderApprovalTransaction->payment_order_id,
                                    'requester_id' => $paymentOrderApprovalTransaction->requester_id,
                                    'assigned_to' => $resolvedApproverId,
                                    'order' => $nextOrder,
                                    'description' => $nextStep->description,
                                    'status' => 'Pending',
                                    'created_by' => auth()->id(),
                                    'updated_by' => auth()->id()
                                ]);
                            $nextTransaction->save();
                            $taskId = DB::table('tasks')->insertGetId([
                                'process_step_id' => $nextStep->id,
                                'process_id' => $nextStep->process_id,
                                'assigned_at' => now(),
                                'urgency' => 'Normal',
                                'order_no' => $nextOrder,
                                'assigned_to_user_id' => $resolvedApproverId,
                                'assigned_from_user_id' => $paymentOrderApprovalTransaction->requester_id,
                                'read_status' => null,
                                'payment_order_id' => $paymentOrderApprovalTransaction->payment_order_id,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]);

                            // Send task assignment notification
                            $task = Task::with(['assignedToUser', 'process'])->find($taskId);
                            if ($task) {
                                $notificationService = new TaskNotificationService();
                                $notificationService->sendTaskAssignmentNotification($task, 'Payment Order Approval');
                            }
                            
                            // Send intermediate status notification to requester
                            $requesterTask = Task::where('payment_order_id', $paymentOrderApprovalTransaction->payment_order_id)
                                ->with(['payment_order.user', 'process'])
                                ->first();
                            
                            if ($requesterTask) {
                                $notificationService = new TaskNotificationService();
                                $requester = $notificationService->getRequesterFromTask($requesterTask);
                                if ($requester) {
                                    $comment = "Approved by " . auth()->user()->name . " (Step " . $paymentOrderApprovalTransaction->order . ")";
                                    $notificationService->sendIntermediateStatusNotification($requesterTask, 'Payment Order Approval', 'Approved', $requester, $comment);
                                }
                            }
                        }
                    }
                } else {
                    // This is the final approval - update Payment Order status and send final notification to requester
                    Log::info('=== FINAL PAYMENT ORDER APPROVAL - UPDATING STATUS ===', [
                        'payment_order_id' => $paymentOrderApprovalTransaction->payment_order_id,
                        'current_status' => DB::table('payment_orders')->where('id', $paymentOrderApprovalTransaction->payment_order_id)->value('status'),
                        'target_status' => 'Approved'
                    ]);
                    
                    // Update Payment Order status to Approved
                    $paymentOrderUpdated = DB::table('payment_orders')
                        ->where('id', $paymentOrderApprovalTransaction->payment_order_id)
                        ->update([
                            'status' => 'Approved',
                            'updated_at' => now()
                        ]);
                    
                    Log::info('=== PAYMENT ORDER STATUS UPDATE RESULT ===', [
                        'payment_order_id' => $paymentOrderApprovalTransaction->payment_order_id,
                        'update_success' => $paymentOrderUpdated,
                        'new_status' => DB::table('payment_orders')->where('id', $paymentOrderApprovalTransaction->payment_order_id)->value('status')
                    ]);
                    
                    $task = Task::where('payment_order_id', $paymentOrderApprovalTransaction->payment_order_id)
                        ->with(['payment_order.user', 'process'])
                        ->first();
                    
                    if ($task) {
                        $notificationService = new TaskNotificationService();
                        $requester = $notificationService->getRequesterFromTask($task);
                        if ($requester) {
                            $notificationService->sendFinalStatusNotification($task, 'Payment Order Approval', 'Approved', $requester);
                        }
                    }
                }
            } elseif ($request->input('status') === 'Reject') {
                // Send rejection notification to requester
                $task = Task::where('payment_order_id', $paymentOrderApprovalTransaction->payment_order_id)
                    ->with(['payment_order.user', 'process'])
                    ->first();
                
                if ($task) {
                    $notificationService = new TaskNotificationService();
                    $requester = $notificationService->getRequesterFromTask($task);
                    if ($requester) {
                        $notificationService->sendFinalStatusNotification($task, 'Payment Order Approval', 'Rejected', $requester);
                    }
                }
            }

            // Final status update for referrer approval after referral response
            // Check if this user was a referrer who should now approve after receiving a referral response
            $isReferrerApprovingAfterReferral = DB::table('tasks')
                ->where('payment_order_id', $paymentOrderApprovalTransaction->payment_order_id)
                ->where('assigned_from_user_id', $paymentOrderApprovalTransaction->assigned_to)
                ->whereNotNull('assigned_to_user_id')
                ->where('created_at', '>=', now()->subMinutes(10))
                ->exists();
                
            if ($isReferrerApprovingAfterReferral && $data['status'] === 'Approve') {
                Log::info('=== FINAL STATUS UPDATE FOR REFERRER APPROVAL (PAYMENT ORDER) ===', [
                    'payment_order_id' => $paymentOrderApprovalTransaction->payment_order_id,
                    'transaction_id' => $paymentOrderApprovalTransaction->id,
                    'final_status' => 'Approve',
                    'is_referrer_approving_after_referral' => true
                ]);
                
                // Ensure the transaction status is set to Approve
                $paymentOrderApprovalTransaction->update(['status' => 'Approve']);
            }

            DB::commit();

            return response()->json([
                'message' => 'Payment order approval transaction updated successfully',
                'data' => new PaymentOrderApprovalTransactionResource(
                    $paymentOrderApprovalTransaction->load([
                        'paymentOrder',
                        'requester',
                        'assignedUser',
                        'referredUser',
                        'createdByUser',
                        'updatedByUser'
                    ])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update payment order approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified payment order approval transaction.
     */
    public function destroy(PaymentOrderApprovalTransaction $paymentOrderApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $paymentOrderApprovalTransaction->delete();

            DB::commit();

            return response()->json([
                'message' => 'Payment order approval transaction deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete payment order approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
