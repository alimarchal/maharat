<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\RfqApprovalTransaction\StoreRfqApprovalTransactionRequest;
use App\Http\Requests\V1\RfqApprovalTransaction\UpdateRfqApprovalTransactionRequest;
use App\Http\Resources\V1\RfqApprovalTransactionResource;
use App\Models\RfqApprovalTransaction;
use App\Models\Task;
use App\QueryParameters\RfqApprovalTransactionParameters;
use App\Services\TaskNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Support\Facades\Log;
use App\Models\Rfq;
use App\Models\ProcessStep as EloquentProcessStep;
use App\Models\User;
use App\Services\ApproverResolver;

class RfqApprovalTransactionController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $transactions = QueryBuilder::for(RfqApprovalTransaction::class)
            ->allowedFilters(RfqApprovalTransactionParameters::ALLOWED_FILTERS)
            ->allowedSorts(RfqApprovalTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(RfqApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No RFQ approval transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return RfqApprovalTransactionResource::collection($transactions);
    }

    public function store(StoreRfqApprovalTransactionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Set the current user as creator if not provided
            if (!isset($validated['created_by'])) {
                $validated['created_by'] = Auth::id();
            }

            $transaction = RfqApprovalTransaction::create($validated);

            DB::commit();

            return response()->json([
                'message' => 'RFQ approval transaction created successfully',
                'data' => new RfqApprovalTransactionResource(
                    $transaction->load([
                        'rfq',
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
                'message' => 'Failed to create RFQ approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $transaction = QueryBuilder::for(RfqApprovalTransaction::class)
            ->allowedIncludes(RfqApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new RfqApprovalTransactionResource($transaction)
        ], Response::HTTP_OK);
    }

    public function update(UpdateRfqApprovalTransactionRequest $request, RfqApprovalTransaction $rfqApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            Log::info('Updating RFQ approval transaction', [
                'transaction_id' => $rfqApprovalTransaction->id,
                'rfq_id' => $rfqApprovalTransaction->rfq_id,
                'new_status' => $validated['status'],
                'order' => $rfqApprovalTransaction->order,
                'validated_data' => $validated
            ]);

            // Set the current user as updater
            $validated['updated_by'] = Auth::id();

            $rfqApprovalTransaction->update($validated);

            // If the status is 'Approve' or 'Referred', check if this is the final approval
            if (in_array($validated['status'], ['Approve', 'Referred'])) {
                // Check if this is a referral response task - if so, skip normal approval flow
                // Look for a task that was created as a result of a referral response
                $referralResponseTask = DB::table('tasks')
                    ->where('rfq_id', $rfqApprovalTransaction->rfq_id)
                    ->where('assigned_to_user_id', $rfqApprovalTransaction->assigned_to)
                    ->whereNotNull('assigned_from_user_id')
                    ->where('created_at', '>=', now()->subMinutes(5)) // Created within last 5 minutes
                    ->first();
                
                if ($referralResponseTask) {
                    Log::info('=== SKIPPING RFQ APPROVAL FLOW - THIS IS A REFERRAL RESPONSE ===', [
                        'rfq_id' => $rfqApprovalTransaction->rfq_id,
                        'task_id' => $referralResponseTask->id,
                        'assigned_from_user_id' => $referralResponseTask->assigned_from_user_id,
                        'assigned_to_user_id' => $referralResponseTask->assigned_to_user_id,
                        'task_created_at' => $referralResponseTask->created_at
                    ]);
                    DB::commit();
                    return response()->json([
                        'message' => 'RFQ approval transaction updated successfully (referral response)',
                        'data' => new RfqApprovalTransactionResource(
                            $rfqApprovalTransaction->load([
                                'rfq',
                                'requester',
                                'assignedTo',
                                'referredTo',
                                'creator',
                                'updater'
                            ])
                        )
                    ], Response::HTTP_OK);
                }
                
                $processSteps = DB::table('process_steps')
                    ->join('processes', 'process_steps.process_id', '=', 'processes.id')
                    ->where('processes.title', 'RFQ Approval')
                    ->orderBy('process_steps.order')
                    ->get();
                $totalRequiredApprovals = $processSteps->count();
                $currentStep = $processSteps->where('order', $rfqApprovalTransaction->order)->first();
                $eloquentCurrentStep = $currentStep ? EloquentProcessStep::find($currentStep->id) : null;
                $isDirectManagerFlow = $eloquentCurrentStep && $eloquentCurrentStep->designation && strcasecmp(trim($eloquentCurrentStep->designation->designation), 'Direct Manager') === 0;
                $currentApprover = User::find($rfqApprovalTransaction->assigned_to);
                $isFinalApproval = $isDirectManagerFlow
                    ? ($currentApprover?->parent_id ? false : true)
                    : ($rfqApprovalTransaction->order == $totalRequiredApprovals);
                if (!$isFinalApproval) {
                    $nextOrder = $rfqApprovalTransaction->order + 1;
                    $nextStep = $processSteps->where('order', $nextOrder)->first();
                    if ($isDirectManagerFlow) {
                        $stepIdForTask = $nextStep->id ?? ($currentStep->id ?? null);
                        $resolvedApproverId = $currentApprover?->parent_id;
                        if ($resolvedApproverId && $stepIdForTask) {
                            $nextTransaction = new 
                                \App\Models\RfqApprovalTransaction([
                                    'rfq_id' => $rfqApprovalTransaction->rfq_id,
                                    'requester_id' => $rfqApprovalTransaction->requester_id,
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
                                'assigned_to_user_id' => $resolvedApproverId,
                                'assigned_from_user_id' => $rfqApprovalTransaction->requester_id,
                                'read_status' => null,
                                'rfq_id' => $rfqApprovalTransaction->rfq_id,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]);
                        }
                    } elseif ($nextStep) {
                        $resolver = new ApproverResolver();
                        $eloquentStep = EloquentProcessStep::find($nextStep->id);
                        $requester = User::find($rfqApprovalTransaction->requester_id);
                        $resolvedApproverId = null;
                        if ($eloquentStep && $eloquentStep->designation && strcasecmp(trim($eloquentStep->designation->designation), 'Direct Manager') === 0) {
                            $currentApprover = User::find($rfqApprovalTransaction->assigned_to);
                            // If current approver has no parent (is head), they approve their own requests
                            $resolvedApproverId = $currentApprover?->parent_id ?: $currentApprover?->id;
                        } else {
                            $resolvedApproverId = $eloquentStep && $requester
                                ? $resolver->resolveApproverId($eloquentStep, $requester)
                                : null;
                        }
                        if ($resolvedApproverId) {
                            $nextTransaction = new 
                                \App\Models\RfqApprovalTransaction([
                                    'rfq_id' => $rfqApprovalTransaction->rfq_id,
                                    'requester_id' => $rfqApprovalTransaction->requester_id,
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
                                'assigned_from_user_id' => $rfqApprovalTransaction->requester_id,
                                'read_status' => null,
                                'rfq_id' => $rfqApprovalTransaction->rfq_id,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]);

                            // Send task assignment notification
                            $task = Task::with(['assignedToUser', 'process'])->find($taskId);
                            if ($task) {
                                $notificationService = new TaskNotificationService();
                                $notificationService->sendTaskAssignmentNotification($task, 'RFQ Approval');
                            }
                            
                            // Send intermediate status notification to requester
                            $requesterTask = Task::where('rfq_id', $rfqApprovalTransaction->rfq_id)
                                ->with(['rfq.requester', 'process'])
                                ->first();
                            
                            if ($requesterTask) {
                                $notificationService = new TaskNotificationService();
                                $requester = $notificationService->getRequesterFromTask($requesterTask);
                                if ($requester) {
                                    $comment = "Approved by " . auth()->user()->name . " (Step " . $rfqApprovalTransaction->order . ")";
                                    $notificationService->sendIntermediateStatusNotification($requesterTask, 'RFQ Approval', 'Approved', $requester, $comment);
                                }
                            }
                        }
                    }
                } else {
                    // This is the final approval - send final notification to requester
                    $task = Task::where('rfq_id', $rfqApprovalTransaction->rfq_id)
                        ->with(['rfq.requester', 'process'])
                        ->first();
                    
                    if ($task) {
                        $notificationService = new TaskNotificationService();
                        $requester = $notificationService->getRequesterFromTask($task);
                        if ($requester) {
                            $notificationService->sendFinalStatusNotification($task, 'RFQ Approval', 'Approved', $requester);
                        }
                    }
                }
            } elseif ($request->input('status') === 'Reject') {
                // Send rejection notification to requester
                $task = Task::where('rfq_id', $rfqApprovalTransaction->rfq_id)
                    ->with(['rfq.requester', 'process'])
                    ->first();
                
                if ($task) {
                    $notificationService = new TaskNotificationService();
                    $requester = $notificationService->getRequesterFromTask($task);
                    if ($requester) {
                        $notificationService->sendFinalStatusNotification($task, 'RFQ Approval', 'Rejected', $requester);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'RFQ approval transaction updated successfully',
                'data' => new RfqApprovalTransactionResource(
                    $rfqApprovalTransaction->load([
                        'rfq',
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
            Log::error('Failed to update RFQ approval transaction', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to update RFQ approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(RfqApprovalTransaction $rfqApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $rfqApprovalTransaction->delete();

            DB::commit();

            return response()->json([
                'message' => 'RFQ approval transaction deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete RFQ approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
