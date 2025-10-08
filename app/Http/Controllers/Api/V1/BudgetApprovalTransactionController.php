<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\BudgetApprovalTransaction\StoreBudgetApprovalTransactionRequest;
use App\Http\Requests\V1\BudgetApprovalTransaction\UpdateBudgetApprovalTransactionRequest;
use App\Http\Resources\V1\BudgetApprovalTransactionResource;
use App\Models\BudgetApprovalTransaction;
use App\Models\Task;
use App\QueryParameters\BudgetApprovalTransactionParameters;
use App\Services\BudgetApprovalService;
use App\Services\TaskNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Support\Facades\Log;
use App\Models\ProcessStep as EloquentProcessStep;
use App\Services\ApproverResolver;
use App\Models\User;

class BudgetApprovalTransactionController extends Controller
{
    /**
     * Display a listing of budget approval transactions.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $transactions = QueryBuilder::for(BudgetApprovalTransaction::class)
            ->allowedFilters(BudgetApprovalTransactionParameters::ALLOWED_FILTERS)
            ->allowedSorts(BudgetApprovalTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(BudgetApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No budget approval transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return BudgetApprovalTransactionResource::collection($transactions);
    }

    /**
     * Store a newly created budget approval transaction.
     */
    public function store(StoreBudgetApprovalTransactionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();

            // Add current user as creator and updater
            $data['created_by'] = auth()->id();
            $data['updated_by'] = auth()->id();

            $transaction = BudgetApprovalTransaction::create($data);

            DB::commit();

            return response()->json([
                'message' => 'Budget approval transaction created successfully',
                'data' => new BudgetApprovalTransactionResource(
                    $transaction->load([
                        'budget',
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
                'message' => 'Failed to create budget approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified budget approval transaction.
     */
    public function show(string $id): JsonResponse
    {
        $transaction = QueryBuilder::for(BudgetApprovalTransaction::class)
            ->allowedIncludes(BudgetApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new BudgetApprovalTransactionResource($transaction)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified budget approval transaction.
     */
    public function update(UpdateBudgetApprovalTransactionRequest $request, BudgetApprovalTransaction $budgetApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();

            // Add current user as updater
            $data['updated_by'] = auth()->id();

            $budgetApprovalTransaction->update($data);

            // Check if this update affects the overall approval status
            $approvalService = new BudgetApprovalService();
            $approvalResult = $approvalService->checkApprovalCompletion($budgetApprovalTransaction->budget_id);
            
            if ($approvalResult === 'Approve' || $approvalResult === 'Reject') {
                $approvalService->updateBudgetStatus($budgetApprovalTransaction->budget_id, $approvalResult);
            }

            // If the status is 'Approve' or 'Referred', check if this is the final approval
            if (isset($data['status']) && in_array($data['status'], ['Approve', 'Referred'])) {
                // Check if this is a referral response task - if so, skip normal approval flow
                // Look for a task that was created as a result of a referral response
                $referralResponseTask = DB::table('tasks')
                    ->where('budget_id', $budgetApprovalTransaction->budget_id)
                    ->where('assigned_to_user_id', $budgetApprovalTransaction->assigned_to)
                    ->whereNotNull('assigned_from_user_id')
                    ->where('created_at', '>=', now()->subMinutes(5)) // Created within last 5 minutes
                    ->first();
                
                if ($referralResponseTask) {
                    Log::info('=== SKIPPING BUDGET APPROVAL FLOW - THIS IS A REFERRAL RESPONSE ===', [
                        'budget_id' => $budgetApprovalTransaction->budget_id,
                        'task_id' => $referralResponseTask->id,
                        'assigned_from_user_id' => $referralResponseTask->assigned_from_user_id,
                        'assigned_to_user_id' => $referralResponseTask->assigned_to_user_id,
                        'task_created_at' => $referralResponseTask->created_at
                    ]);
                    DB::commit();
                    return response()->json([
                        'message' => 'Budget approval transaction updated successfully (referral response)',
                        'data' => new BudgetApprovalTransactionResource(
                            $budgetApprovalTransaction->load([
                                'budget',
                                'requester',
                                'assignedUser',
                                'referredUser',
                                'createdByUser',
                                'updatedByUser'
                            ])
                        )
                    ], Response::HTTP_OK);
                }
                
                $processSteps = DB::table('process_steps')
                    ->join('processes', 'process_steps.process_id', '=', 'processes.id')
                    ->where('processes.title', 'Total Budget Approval')
                    ->orderBy('process_steps.order')
                    ->get();
                $totalRequiredApprovals = $processSteps->count();
                $currentStep = $processSteps->where('order', $budgetApprovalTransaction->order)->first();
                $eloquentCurrentStep = $currentStep ? EloquentProcessStep::find($currentStep->id) : null;
                $isDirectManagerFlow = $eloquentCurrentStep && $eloquentCurrentStep->designation && strcasecmp(trim($eloquentCurrentStep->designation->designation), 'Direct Manager') === 0;
                $currentApprover = User::find($budgetApprovalTransaction->assigned_to);
                $isFinalApproval = $isDirectManagerFlow
                    ? ($currentApprover?->parent_id ? false : true)
                    : ($budgetApprovalTransaction->order == $totalRequiredApprovals);
                if (!$isFinalApproval) {
                    $nextOrder = $budgetApprovalTransaction->order + 1;
                    $nextStep = $processSteps->where('order', $nextOrder)->first();
                    if ($isDirectManagerFlow) {
                        $stepIdForTask = $nextStep->id ?? ($currentStep->id ?? null);
                        $resolvedApproverId = $currentApprover?->parent_id;
                        if ($resolvedApproverId && $stepIdForTask) {
                            $nextTransaction = new 
                                \App\Models\BudgetApprovalTransaction([
                                    'budget_id' => $budgetApprovalTransaction->budget_id,
                                    'requester_id' => $budgetApprovalTransaction->requester_id,
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
                                'assigned_to_user_id' => $resolvedApproverId,
                                'assigned_from_user_id' => $budgetApprovalTransaction->requester_id,
                                'read_status' => null,
                                'budget_id' => $budgetApprovalTransaction->budget_id,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]);
                        }
                    } elseif ($nextStep) {
                        $resolver = new ApproverResolver();
                        $eloquentStep = EloquentProcessStep::find($nextStep->id);
                        $requester = User::find($budgetApprovalTransaction->requester_id);
                        $resolvedApproverId = null;
                        if ($eloquentStep && $eloquentStep->designation && strcasecmp(trim($eloquentStep->designation->designation), 'Direct Manager') === 0) {
                            $currentApprover = User::find($budgetApprovalTransaction->assigned_to);
                            // If current approver has no parent (is head), they approve their own requests
                            $resolvedApproverId = $currentApprover?->parent_id ?: $currentApprover?->id;
                        } else {
                            $resolvedApproverId = $eloquentStep && $requester
                                ? $resolver->resolveApproverId($eloquentStep, $requester)
                                : null;
                        }
                        if ($resolvedApproverId) {
                            $nextTransaction = new 
                                \App\Models\BudgetApprovalTransaction([
                                    'budget_id' => $budgetApprovalTransaction->budget_id,
                                    'requester_id' => $budgetApprovalTransaction->requester_id,
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
                                'assigned_to_user_id' => $resolvedApproverId,
                                'assigned_from_user_id' => $budgetApprovalTransaction->requester_id,
                                'read_status' => null,
                                'budget_id' => $budgetApprovalTransaction->budget_id,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]);

                            // Send task assignment notification
                            $task = Task::with(['assignedToUser', 'process'])->find($taskId);
                            if ($task) {
                                $notificationService = new TaskNotificationService();
                                $notificationService->sendTaskAssignmentNotification($task, 'Total Budget Approval');
                            }
                            
                            // Send intermediate status notification to requester
                            // Get the original initiator from the first budget approval transaction (order = 1)
                            $originalInitiator = BudgetApprovalTransaction::where('budget_id', $budgetApprovalTransaction->budget_id)
                                ->where('order', 1)
                                ->first();
                            
                            \Log::info('BudgetApprovalTransaction: Original initiator found', [
                                'budget_id' => $budgetApprovalTransaction->budget_id,
                                'originalInitiatorId' => $originalInitiator ? $originalInitiator->id : null,
                                'originalInitiatorOrder' => $originalInitiator ? $originalInitiator->order : null,
                                'originalInitiatorCreatedBy' => $originalInitiator ? $originalInitiator->created_by : null,
                                'currentTransactionId' => $budgetApprovalTransaction->id,
                                'currentTransactionOrder' => $budgetApprovalTransaction->order
                            ]);
                            
                            if ($originalInitiator && $originalInitiator->created_by) {
                                $requester = User::find($originalInitiator->created_by);
                                \Log::info('BudgetApprovalTransaction: Requester found', [
                                    'requesterId' => $requester ? $requester->id : null,
                                    'requesterEmail' => $requester ? $requester->email : null
                                ]);
                                
                                if ($requester) {
                                    // Get the first task for this budget to use for notification
                                    $firstTask = Task::where('budget_id', $budgetApprovalTransaction->budget_id)
                                        ->orderBy('created_at', 'asc')
                                        ->first();
                                    
                                    if ($firstTask) {
                                        $notificationService = new TaskNotificationService();
                                        $comment = "Approved by " . auth()->user()->name . " (Step " . $budgetApprovalTransaction->order . ")";
                                        $notificationService->sendIntermediateStatusNotification($firstTask, 'Total Budget Approval', 'Approved', $requester, $comment);
                                        \Log::info('BudgetApprovalTransaction: Intermediate notification sent to original initiator', [
                                            'requesterId' => $requester->id,
                                            'requesterEmail' => $requester->email
                                        ]);
                                    }
                                }
                            }
                        }
                    }
                } else {
                    // This is the final approval - send final notification to requester
                    // Get the original initiator from the first budget approval transaction (order = 1)
                    $originalInitiator = BudgetApprovalTransaction::where('budget_id', $budgetApprovalTransaction->budget_id)
                        ->where('order', 1)
                        ->first();
                    
                    \Log::info('BudgetApprovalTransaction: Final approval - Original initiator found', [
                        'budget_id' => $budgetApprovalTransaction->budget_id,
                        'originalInitiatorId' => $originalInitiator ? $originalInitiator->id : null,
                        'originalInitiatorOrder' => $originalInitiator ? $originalInitiator->order : null,
                        'originalInitiatorCreatedBy' => $originalInitiator ? $originalInitiator->created_by : null
                    ]);
                    
                    if ($originalInitiator && $originalInitiator->created_by) {
                        $requester = User::find($originalInitiator->created_by);
                        \Log::info('BudgetApprovalTransaction: Final approval - Requester found', [
                            'requesterId' => $requester ? $requester->id : null,
                            'requesterEmail' => $requester ? $requester->email : null
                        ]);
                        
                        if ($requester) {
                            // Get the first task for this budget to use for notification
                            $firstTask = Task::where('budget_id', $budgetApprovalTransaction->budget_id)
                                ->orderBy('created_at', 'asc')
                                ->first();
                            
                            if ($firstTask) {
                                $notificationService = new TaskNotificationService();
                                $notificationService->sendFinalStatusNotification($firstTask, 'Total Budget Approval', 'Approved', $requester);
                                \Log::info('BudgetApprovalTransaction: Final approval notification sent to original initiator', [
                                    'requesterId' => $requester->id,
                                    'requesterEmail' => $requester->email
                                ]);
                            }
                        }
                    }
                }
            } elseif ($request->input('status') === 'Reject') {
                // Send rejection notification to requester
                // Get the original initiator from the first budget approval transaction (order = 1)
                $originalInitiator = BudgetApprovalTransaction::where('budget_id', $budgetApprovalTransaction->budget_id)
                    ->where('order', 1)
                    ->first();
                
                \Log::info('BudgetApprovalTransaction: Rejection - Original initiator found', [
                    'budget_id' => $budgetApprovalTransaction->budget_id,
                    'originalInitiatorId' => $originalInitiator ? $originalInitiator->id : null,
                    'originalInitiatorOrder' => $originalInitiator ? $originalInitiator->order : null,
                    'originalInitiatorCreatedBy' => $originalInitiator ? $originalInitiator->created_by : null
                ]);
                
                if ($originalInitiator && $originalInitiator->created_by) {
                    $requester = User::find($originalInitiator->created_by);
                    \Log::info('BudgetApprovalTransaction: Rejection - Requester found', [
                        'requesterId' => $requester ? $requester->id : null,
                        'requesterEmail' => $requester ? $requester->email : null
                    ]);
                    
                    if ($requester) {
                        // Get the first task for this budget to use for notification
                        $firstTask = Task::where('budget_id', $budgetApprovalTransaction->budget_id)
                            ->orderBy('created_at', 'asc')
                            ->first();
                        
                        if ($firstTask) {
                            $notificationService = new TaskNotificationService();
                            $notificationService->sendFinalStatusNotification($firstTask, 'Total Budget Approval', 'Rejected', $requester);
                            \Log::info('BudgetApprovalTransaction: Rejection notification sent to original initiator', [
                                'requesterId' => $requester->id,
                                'requesterEmail' => $requester->email
                            ]);
                        }
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Budget approval transaction updated successfully',
                'data' => new BudgetApprovalTransactionResource(
                    $budgetApprovalTransaction->load([
                        'budget',
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
                'message' => 'Failed to update budget approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified budget approval transaction.
     */
    public function destroy(BudgetApprovalTransaction $budgetApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $budgetApprovalTransaction->delete();

            DB::commit();

            return response()->json([
                'message' => 'Budget approval transaction deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete budget approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
