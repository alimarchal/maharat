<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\PoApprovalTransaction\StorePoApprovalTransactionRequest;
use App\Http\Requests\V1\PoApprovalTransaction\UpdatePoApprovalTransactionRequest;
use App\Http\Resources\V1\PoApprovalTransactionResource;
use App\Models\PoApprovalTransaction;
use App\Models\Task;
use App\QueryParameters\PoApprovalTransactionParameters;
use App\Services\TaskNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Support\Facades\Log;
use App\Models\ProcessStep as EloquentProcessStep;
use App\Models\User;
use App\Services\ApproverResolver;

class PoApprovalTransactionController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $transactions = QueryBuilder::for(PoApprovalTransaction::class)
            ->allowedFilters(PoApprovalTransactionParameters::ALLOWED_FILTERS)
            ->allowedFilters(
                PoApprovalTransactionParameters::ALLOWED_FILTERS_EXACT
            )
            ->allowedSorts(PoApprovalTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(PoApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No purchase order approval transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return PoApprovalTransactionResource::collection($transactions);
    }

    public function store(StorePoApprovalTransactionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Set the current user as creator if not provided
            if (!isset($validated['created_by'])) {
                $validated['created_by'] = Auth::id();
            }

            $transaction = PoApprovalTransaction::create($validated);

            DB::commit();

            return response()->json([
                'message' => 'Purchase order approval transaction created successfully',
                'data' => new PoApprovalTransactionResource(
                    $transaction->load([
                        'purchaseOrder',
                        'requester',
                        'assignedTo',
                        'referredTo',
                        'creator',
                        'updater'
                    ])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create purchase order approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $transaction = QueryBuilder::for(PoApprovalTransaction::class)
            ->allowedIncludes(PoApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new PoApprovalTransactionResource($transaction)
        ], Response::HTTP_OK);
    }

    public function update(UpdatePoApprovalTransactionRequest $request, PoApprovalTransaction $poApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Set the current user as updater
            $validated['updated_by'] = Auth::id();

            $poApprovalTransaction->update($validated);

            // If the status is 'Approve' or 'Referred', check if this is the final approval
            if (isset($validated['status']) && in_array($validated['status'], ['Approve', 'Referred'])) {
                // Check if this is a referral response task - if so, skip normal approval flow
                // Look for a task that was created as a result of a referral response
                $referralResponseTask = DB::table('tasks')
                    ->where('purchase_order_id', $poApprovalTransaction->purchase_order_id)
                    ->where('assigned_to_user_id', $poApprovalTransaction->assigned_to)
                    ->whereNotNull('assigned_from_user_id')
                    ->where('created_at', '>=', now()->subMinutes(5)) // Created within last 5 minutes
                    ->first();
                
                if ($referralResponseTask) {
                    Log::info('=== SKIPPING PURCHASE ORDER APPROVAL FLOW - THIS IS A REFERRAL RESPONSE ===', [
                        'purchase_order_id' => $poApprovalTransaction->purchase_order_id,
                        'task_id' => $referralResponseTask->id,
                        'assigned_from_user_id' => $referralResponseTask->assigned_from_user_id,
                        'assigned_to_user_id' => $referralResponseTask->assigned_to_user_id,
                        'task_created_at' => $referralResponseTask->created_at
                    ]);
                    DB::commit();
                    return response()->json([
                        'message' => 'Purchase order approval transaction updated successfully (referral response)',
                        'data' => new PoApprovalTransactionResource(
                            $poApprovalTransaction->load([
                                'purchaseOrder',
                                'requester',
                                'assignedTo',
                                'referredTo',
                                'creator',
                                'updater'
                            ])
                        )
                    ], Response::HTTP_OK);
                }
                
                // Check if this is a referrer approving after a referral response
                // Look for a task that was created as a result of this user referring to someone else
                $referrerTask = DB::table('tasks')
                    ->where('purchase_order_id', $poApprovalTransaction->purchase_order_id)
                    ->where('assigned_from_user_id', $poApprovalTransaction->assigned_to)
                    ->whereNotNull('assigned_to_user_id')
                    ->where('created_at', '>=', now()->subMinutes(10)) // Created within last 10 minutes
                    ->first();
                
                if ($referrerTask && $validated['status'] === 'Approve') {
                    Log::info('=== REFERRER APPROVING AFTER REFERRAL RESPONSE (PURCHASE ORDER) ===', [
                        'purchase_order_id' => $poApprovalTransaction->purchase_order_id,
                        'referrer_task_id' => $referrerTask->id,
                        'referrer_user_id' => $poApprovalTransaction->assigned_to,
                        'referee_user_id' => $referrerTask->assigned_to_user_id,
                        'status' => $validated['status']
                    ]);
                    
                    // Update the referrer's transaction status to Approve
                    $poApprovalTransaction->update(['status' => 'Approve']);
                    
                    // Continue with normal approval flow
                    Log::info('=== CONTINUING WITH NORMAL PURCHASE ORDER APPROVAL FLOW AFTER REFERRAL ===', [
                        'purchase_order_id' => $poApprovalTransaction->purchase_order_id,
                        'transaction_id' => $poApprovalTransaction->id,
                        'order' => $poApprovalTransaction->order
                    ]);
                }
                
                $processSteps = DB::table('process_steps')
                    ->join('processes', 'process_steps.process_id', '=', 'processes.id')
                    ->where('processes.title', 'Purchase Order Approval')
                    ->orderBy('process_steps.order')
                    ->get();
                $totalRequiredApprovals = $processSteps->count();
                $currentStep = $processSteps->where('order', $poApprovalTransaction->order)->first();
                $eloquentCurrentStep = $currentStep ? EloquentProcessStep::find($currentStep->id) : null;
                $isDirectManagerFlow = $eloquentCurrentStep && $eloquentCurrentStep->designation && strcasecmp(trim($eloquentCurrentStep->designation->designation), 'Direct Manager') === 0;
                $currentApprover = User::find($poApprovalTransaction->assigned_to);
                $isFinalApproval = $isDirectManagerFlow
                    ? ($currentApprover?->parent_id ? false : true)
                    : ($poApprovalTransaction->order == $totalRequiredApprovals);
                
                Log::info('=== PURCHASE ORDER APPROVAL CHECK ===', [
                    'purchase_order_id' => $poApprovalTransaction->purchase_order_id,
                    'current_order' => $poApprovalTransaction->order,
                    'total_required_approvals' => $totalRequiredApprovals,
                    'is_final_approval' => $isFinalApproval,
                    'process_steps_count' => $processSteps->count()
                ]);
                
                if (!$isFinalApproval) {
                    $nextOrder = $poApprovalTransaction->order + 1;
                    $nextStep = $processSteps->where('order', $nextOrder)->first();
                    if ($isDirectManagerFlow) {
                        $stepIdForTask = $nextStep->id ?? ($currentStep->id ?? null);
                        $resolvedApproverId = $currentApprover?->parent_id;
                        if ($resolvedApproverId && $stepIdForTask) {
                            $nextTransaction = new 
                                \App\Models\PoApprovalTransaction([
                                    'purchase_order_id' => $poApprovalTransaction->purchase_order_id,
                                    'requester_id' => $poApprovalTransaction->requester_id,
                                    'assigned_to' => $resolvedApproverId,
                                    'order' => $nextOrder,
                                    'description' => $nextStep->description ?? ($eloquentCurrentStep?->description),
                                    'status' => 'Pending',
                                    'created_by' => Auth::id(),
                                    'updated_by' => Auth::id()
                                ]);
                            $nextTransaction->save();
                            $taskId = DB::table('tasks')->insertGetId([
                                'process_step_id' => $stepIdForTask,
                                'process_id' => $nextStep->process_id ?? ($eloquentCurrentStep?->process_id),
                                'assigned_at' => now(),
                                'urgency' => 'Normal',
                                'order_no' => $nextOrder,
                                'assigned_to_user_id' => $resolvedApproverId,
                                'assigned_from_user_id' => $poApprovalTransaction->requester_id,
                                'read_status' => null,
                                'purchase_order_id' => $poApprovalTransaction->purchase_order_id,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]);
                        }
                    } elseif ($nextStep) {
                        $resolver = new ApproverResolver();
                        $eloquentStep = EloquentProcessStep::find($nextStep->id);
                        $requester = User::find($poApprovalTransaction->requester_id);
                        $resolvedApproverId = null;
                        if ($eloquentStep && $eloquentStep->designation && strcasecmp(trim($eloquentStep->designation->designation), 'Direct Manager') === 0) {
                            $currentApprover = User::find($poApprovalTransaction->assigned_to);
                            // If current approver has no parent (is head), they approve their own requests
                            $resolvedApproverId = $currentApprover?->parent_id ?: $currentApprover?->id;
                        } else {
                            $resolvedApproverId = $eloquentStep && $requester
                                ? $resolver->resolveApproverId($eloquentStep, $requester)
                                : null;
                        }
                        if ($resolvedApproverId) {
                            $nextTransaction = new 
                                \App\Models\PoApprovalTransaction([
                                    'purchase_order_id' => $poApprovalTransaction->purchase_order_id,
                                    'requester_id' => $poApprovalTransaction->requester_id,
                                    'assigned_to' => $resolvedApproverId,
                                    'order' => $nextOrder,
                                    'description' => $nextStep->description,
                                    'status' => 'Pending',
                                    'created_by' => Auth::id(),
                                    'updated_by' => Auth::id()
                                ]);
                            $nextTransaction->save();
                            $taskId = DB::table('tasks')->insertGetId([
                                'process_step_id' => $nextStep->id,
                                'process_id' => $nextStep->process_id,
                                'assigned_at' => now(),
                                'urgency' => 'Normal',
                                'order_no' => $nextOrder,
                                'assigned_to_user_id' => $resolvedApproverId,
                                'assigned_from_user_id' => $poApprovalTransaction->requester_id,
                                'read_status' => null,
                                'purchase_order_id' => $poApprovalTransaction->purchase_order_id,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]);

                            // Send task assignment notification
                            $task = Task::with(['assignedToUser', 'process'])->find($taskId);
                            if ($task) {
                                $notificationService = new TaskNotificationService();
                                $notificationService->sendTaskAssignmentNotification($task, 'Purchase Order Approval');
                            }
                            
                            // Send intermediate status notification to requester
                            $requesterTask = Task::where('purchase_order_id', $poApprovalTransaction->purchase_order_id)
                                ->with(['purchase_order.user', 'process'])
                                ->first();
                            
                            if ($requesterTask) {
                                $notificationService = new TaskNotificationService();
                                $requester = $notificationService->getRequesterFromTask($requesterTask);
                                Log::info('=== INTERMEDIATE APPROVAL - REQUESTER CHECK ===', [
                                    'purchase_order_id' => $poApprovalTransaction->purchase_order_id,
                                    'requester_task_found' => $requesterTask ? true : false,
                                    'requester_found' => $requester ? true : false,
                                    'requester_id' => $requester ? $requester->id : null,
                                    'requester_email' => $requester ? $requester->email : null
                                ]);
                                if ($requester) {
                                    $comment = "Approved by " . auth()->user()->name . " (Step " . $poApprovalTransaction->order . ")";
                                    $notificationService->sendIntermediateStatusNotification($requesterTask, 'Purchase Order Approval', 'Approved', $requester, $comment);
                                }
                            }
                        }
                    }
                } else {
                    // This is the final approval - send final notification to requester
                    $task = Task::where('purchase_order_id', $poApprovalTransaction->purchase_order_id)
                        ->with(['purchase_order.user', 'process'])
                        ->first();
                    
                    Log::info('=== FINAL APPROVAL - REQUESTER CHECK ===', [
                        'purchase_order_id' => $poApprovalTransaction->purchase_order_id,
                        'task_found' => $task ? true : false,
                        'task_id' => $task ? $task->id : null
                    ]);
                    
                    if ($task) {
                        $notificationService = new TaskNotificationService();
                        $requester = $notificationService->getRequesterFromTask($task);
                        Log::info('=== FINAL APPROVAL - REQUESTER DETAILS ===', [
                            'purchase_order_id' => $poApprovalTransaction->purchase_order_id,
                            'requester_found' => $requester ? true : false,
                            'requester_id' => $requester ? $requester->id : null,
                            'requester_email' => $requester ? $requester->email : null,
                            'purchase_order_user_id' => $task->purchase_order ? $task->purchase_order->user_id : null
                        ]);
                        if ($requester) {
                            $notificationService->sendFinalStatusNotification($task, 'Purchase Order Approval', 'Approved', $requester);
                        }
                    }
                }
            } elseif ($request->input('status') === 'Reject') {
                // Send rejection notification to requester
                $task = Task::where('purchase_order_id', $poApprovalTransaction->purchase_order_id)
                    ->with(['purchase_order.user', 'process'])
                    ->first();
                
                if ($task) {
                    $notificationService = new TaskNotificationService();
                    $requester = $notificationService->getRequesterFromTask($task);
                    if ($requester) {
                        $notificationService->sendFinalStatusNotification($task, 'Purchase Order Approval', 'Rejected', $requester);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Purchase order approval transaction updated successfully',
                'data' => new PoApprovalTransactionResource(
                    $poApprovalTransaction->load([
                        'purchaseOrder',
                        'requester',
                        'assignedTo',
                        'referredTo',
                        'creator',
                        'updater'
                    ])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update purchase order approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(PoApprovalTransaction $poApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $poApprovalTransaction->delete();

            DB::commit();

            return response()->json([
                'message' => 'Purchase order approval transaction deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete purchase order approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
