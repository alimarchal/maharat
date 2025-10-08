<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\GrnApprovalTransaction\StoreGrnApprovalTransactionRequest;
use App\Http\Requests\V1\GrnApprovalTransaction\UpdateGrnApprovalTransactionRequest;
use App\Http\Resources\V1\GrnApprovalTransactionResource;
use App\Models\GrnApprovalTransaction;
use App\Models\Task;
use App\QueryParameters\GrnApprovalTransactionParameters;
use App\Services\TaskNotificationService;
use App\Services\ApproverResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Support\Facades\Log;
use App\Models\ProcessStep as EloquentProcessStep;
use App\Models\User;

class GrnApprovalTransactionController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $transactions = QueryBuilder::for(GrnApprovalTransaction::class)
            ->allowedFilters(GrnApprovalTransactionParameters::ALLOWED_FILTERS)
            ->allowedSorts(GrnApprovalTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(GrnApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No GRN approval transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return GrnApprovalTransactionResource::collection($transactions);
    }

    public function store(StoreGrnApprovalTransactionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Set the current user as creator if not provided
            if (!isset($validated['created_by'])) {
                $validated['created_by'] = Auth::id();
            }

            $transaction = GrnApprovalTransaction::create($validated);

            DB::commit();

            return response()->json([
                'message' => 'GRN approval transaction created successfully',
                'data' => new GrnApprovalTransactionResource(
                    $transaction->load([
                        'grn',
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
                'message' => 'Failed to create GRN approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $transaction = QueryBuilder::for(GrnApprovalTransaction::class)
            ->allowedIncludes(GrnApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new GrnApprovalTransactionResource($transaction)
        ], Response::HTTP_OK);
    }

    public function update(UpdateGrnApprovalTransactionRequest $request, GrnApprovalTransaction $grnApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            Log::info('Updating GRN approval transaction', [
                'transaction_id' => $grnApprovalTransaction->id,
                'grn_id' => $grnApprovalTransaction->grn_id,
                'new_status' => $validated['status'],
                'order' => $grnApprovalTransaction->order,
                'validated_data' => $validated
            ]);

            // Set the current user as updater
            $validated['updated_by'] = Auth::id();

            $grnApprovalTransaction->update($validated);

            // If the status is 'Approve', check if this is the final approval
            if ($validated['status'] === 'Approve') {
                // Check if this is a referral response task - if so, skip normal approval flow
                $currentTask = DB::table('tasks')
                    ->where('grn_id', $grnApprovalTransaction->grn_id)
                    ->where('process_step_id', $grnApprovalTransaction->process_step_id ?? null)
                    ->where('assigned_to_user_id', $grnApprovalTransaction->assigned_to)
                    ->whereNotNull('assigned_from_user_id')
                    ->first();
                
                if ($currentTask) {
                    Log::info('=== SKIPPING GRN APPROVAL FLOW - THIS IS A REFERRAL RESPONSE ===', [
                        'grn_id' => $grnApprovalTransaction->grn_id,
                        'task_id' => $currentTask->id,
                        'assigned_from_user_id' => $currentTask->assigned_from_user_id,
                        'assigned_to_user_id' => $currentTask->assigned_to_user_id
                    ]);
                    DB::commit();
                    return response()->json([
                        'message' => 'GRN approval transaction updated successfully (referral response)',
                        'data' => new GrnApprovalTransactionResource(
                            $grnApprovalTransaction->load([
                                'grn',
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
                    ->where('processes.title', 'GRN Approval')
                    ->orderBy('process_steps.order')
                    ->get();
                $totalRequiredApprovals = $processSteps->count();
                $currentStep = $processSteps->where('order', $grnApprovalTransaction->order)->first();
                $eloquentCurrentStep = $currentStep ? EloquentProcessStep::find($currentStep->id) : null;
                $isDirectManagerFlow = $eloquentCurrentStep && $eloquentCurrentStep->designation && strcasecmp(trim($eloquentCurrentStep->designation->designation), 'Direct Manager') === 0;
                $currentApprover = User::find($grnApprovalTransaction->assigned_to);
                $isFinalApproval = $isDirectManagerFlow
                    ? ($currentApprover?->parent_id ? false : true)
                    : ($grnApprovalTransaction->order == $totalRequiredApprovals);
                
                if (!$isFinalApproval) {
                    $nextOrder = $grnApprovalTransaction->order + 1;
                    $nextStep = $processSteps->where('order', $nextOrder)->first();
                    
                    if ($isDirectManagerFlow) {
                        $stepIdForTask = $nextStep->id ?? ($currentStep->id ?? null);
                        $resolvedApproverId = $currentApprover?->parent_id;
                        
                        if ($resolvedApproverId && $stepIdForTask) {
                            $nextTransaction = new GrnApprovalTransaction([
                                'grn_id' => $grnApprovalTransaction->grn_id,
                                'requester_id' => $grnApprovalTransaction->requester_id,
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
                                'assigned_from_user_id' => $grnApprovalTransaction->requester_id,
                                'read_status' => null,
                                'grn_id' => $grnApprovalTransaction->grn_id,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]);
                        }
                    } elseif ($nextStep) {
                        $resolver = new ApproverResolver();
                        $eloquentStep = EloquentProcessStep::find($nextStep->id);
                        $requester = User::find($grnApprovalTransaction->requester_id);
                        $resolvedApproverId = null;
                        
                        if ($eloquentStep && $eloquentStep->designation && strcasecmp(trim($eloquentStep->designation->designation), 'Direct Manager') === 0) {
                            $currentApprover = User::find($grnApprovalTransaction->assigned_to);
                            $resolvedApproverId = $currentApprover?->parent_id ?: $currentApprover?->id;
                        } else {
                            $resolvedApproverId = $eloquentStep && $requester
                                ? $resolver->resolveApproverId($eloquentStep, $requester)
                                : null;
                        }
                        
                        if ($resolvedApproverId) {
                            $nextTransaction = new GrnApprovalTransaction([
                                'grn_id' => $grnApprovalTransaction->grn_id,
                                'requester_id' => $grnApprovalTransaction->requester_id,
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
                                'assigned_from_user_id' => $grnApprovalTransaction->requester_id,
                                'read_status' => null,
                                'grn_id' => $grnApprovalTransaction->grn_id,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]);

                            // Send task assignment notification
                            $task = Task::with(['assignedToUser', 'process'])->find($taskId);
                            if ($task) {
                                $notificationService = new TaskNotificationService();
                                $notificationService->sendTaskAssignmentNotification($task, 'GRN Approval');
                            }
                            
                            // Send intermediate status notification to requester
                            $requesterTask = Task::where('grn_id', $grnApprovalTransaction->grn_id)
                                ->with(['grn.user', 'process'])
                                ->first();
                            
                            if ($requesterTask) {
                                $notificationService = new TaskNotificationService();
                                $requester = $requesterTask->grn->user ?? null;
                                if ($requester) {
                                    $comment = "Approved by " . auth()->user()->name . " (Step " . $grnApprovalTransaction->order . ")";
                                    $notificationService->sendIntermediateStatusNotification($requesterTask, 'GRN Approval', 'Approved', $requester, $comment);
                                }
                            }
                        }
                    }
                } else {
                    // This is the final approval - send final notification to requester
                    $task = Task::where('grn_id', $grnApprovalTransaction->grn_id)
                        ->with(['grn.user', 'process'])
                        ->first();
                    
                    if ($task) {
                        $notificationService = new TaskNotificationService();
                        $requester = $task->grn->user ?? null;
                        if ($requester) {
                            $notificationService->sendFinalStatusNotification($task, 'GRN Approval', 'Approved', $requester);
                        }
                    }
                }
            } elseif ($request->input('status') === 'Reject') {
                // Send rejection notification to requester
                $task = Task::where('grn_id', $grnApprovalTransaction->grn_id)
                    ->with(['grn.user', 'process'])
                    ->first();
                
                if ($task) {
                    $notificationService = new TaskNotificationService();
                    $requester = $task->grn->user ?? null;
                    if ($requester) {
                        $notificationService->sendFinalStatusNotification($task, 'GRN Approval', 'Rejected', $requester);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'GRN approval transaction updated successfully',
                'data' => new GrnApprovalTransactionResource(
                    $grnApprovalTransaction->load([
                        'grn',
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
            Log::error('Failed to update GRN approval transaction', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to update GRN approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(GrnApprovalTransaction $grnApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $grnApprovalTransaction->delete();

            DB::commit();

            return response()->json([
                'message' => 'GRN approval transaction deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete GRN approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
