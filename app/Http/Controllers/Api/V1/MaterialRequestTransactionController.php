<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\MaterialRequestTransaction\StoreMaterialRequestTransactionRequest;
use App\Http\Requests\V1\MaterialRequestTransaction\UpdateMaterialRequestTransactionRequest;
use App\Http\Resources\V1\MaterialRequestTransactionResource;
use App\Models\MaterialRequestTransaction;
use App\Models\ProcessStep as EloquentProcessStep;
use App\Models\User;
use App\Models\Task;
use App\QueryParameters\MaterialRequestTransactionParameters;
use App\Services\TaskNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use App\Services\ApproverResolver;
use Spatie\QueryBuilder\QueryBuilder;

class MaterialRequestTransactionController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $transactions = QueryBuilder::for(MaterialRequestTransaction::class)
            ->allowedFilters(MaterialRequestTransactionParameters::ALLOWED_FILTERS)
            ->allowedSorts(MaterialRequestTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(MaterialRequestTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No material request transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return MaterialRequestTransactionResource::collection($transactions);
    }

    public function store(StoreMaterialRequestTransactionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $transaction = MaterialRequestTransaction::create($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Material request transaction created successfully',
                'data' => new MaterialRequestTransactionResource(
                    $transaction->load(['materialRequest', 'requester', 'assignedUser', 'referredUser'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create material request transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $transaction = QueryBuilder::for(MaterialRequestTransaction::class)
            ->allowedIncludes(MaterialRequestTransactionParameters::ALLOWED_INCLUDES)
            ->find($id);

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Resource not found'
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'success' => true,
            'data' => new MaterialRequestTransactionResource($transaction)
        ], Response::HTTP_OK);
    }

    public function update(UpdateMaterialRequestTransactionRequest $request, MaterialRequestTransaction $materialRequestTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $materialRequestTransaction->update($request->validated());

            // If the status is 'Approve' or 'Referred', check if this is the final approval
            if (in_array($request->input('status'), ['Approve', 'Referred'])) {
                Log::info('=== MATERIAL REQUEST APPROVAL TRANSACTION CONTROLLER UPDATE CALLED ===', [
                    'transaction_id' => $materialRequestTransaction->id,
                    'material_request_id' => $materialRequestTransaction->material_request_id,
                    'assigned_to' => $materialRequestTransaction->assigned_to,
                    'status' => $request->input('status'),
                    'order' => $materialRequestTransaction->order
                ]);
                
                // Check if this is a referral response task - if so, skip normal approval flow
                // Look for a task that was created as a result of a referral response
                $referralResponseTask = DB::table('tasks')
                    ->where('material_request_id', $materialRequestTransaction->material_request_id)
                    ->where('assigned_to_user_id', $materialRequestTransaction->assigned_to)
                    ->whereNotNull('assigned_from_user_id')
                    ->where('created_at', '>=', now()->subMinutes(5)) // Created within last 5 minutes
                    ->first();
                
                Log::info('=== CHECKING FOR REFERRAL RESPONSE TASK ===', [
                    'material_request_id' => $materialRequestTransaction->material_request_id,
                    'assigned_to' => $materialRequestTransaction->assigned_to,
                    'referral_response_task_found' => $referralResponseTask ? true : false,
                    'referral_response_task_id' => $referralResponseTask ? $referralResponseTask->id : null,
                    'referral_response_task_assigned_from' => $referralResponseTask ? $referralResponseTask->assigned_from_user_id : null,
                    'referral_response_task_created_at' => $referralResponseTask ? $referralResponseTask->created_at : null
                ]);
                
                if ($referralResponseTask) {
                    Log::info('=== SKIPPING MATERIAL REQUEST APPROVAL FLOW - THIS IS A REFERRAL RESPONSE ===', [
                        'material_request_id' => $materialRequestTransaction->material_request_id,
                        'task_id' => $referralResponseTask->id,
                        'assigned_from_user_id' => $referralResponseTask->assigned_from_user_id,
                        'assigned_to_user_id' => $referralResponseTask->assigned_to_user_id,
                        'task_created_at' => $referralResponseTask->created_at
                    ]);
                    DB::commit();
                    return response()->json([
                        'message' => 'Material request transaction updated successfully (referral response)',
                        'data' => new MaterialRequestTransactionResource(
                            $materialRequestTransaction->load(['materialRequest', 'requester', 'assignedUser', 'referredUser'])
                        )
                    ], Response::HTTP_OK);
                }
                
                Log::info('=== PROCEEDING WITH NORMAL MATERIAL REQUEST APPROVAL FLOW ===', [
                    'material_request_id' => $materialRequestTransaction->material_request_id,
                    'assigned_to' => $materialRequestTransaction->assigned_to,
                    'order' => $materialRequestTransaction->order
                ]);
                
                $processSteps = DB::table('process_steps')
                    ->join('processes', 'process_steps.process_id', '=', 'processes.id')
                    ->where('processes.title', 'Material Request')
                    ->orderBy('process_steps.order')
                    ->get();
                $totalRequiredApprovals = $processSteps->count();
                $currentStep = $processSteps->where('order', $materialRequestTransaction->order)->first();
                $eloquentCurrentStep = $currentStep ? EloquentProcessStep::find($currentStep->id) : null;
                $isDirectManagerFlow = $eloquentCurrentStep && $eloquentCurrentStep->designation && strcasecmp(trim($eloquentCurrentStep->designation->designation), 'Direct Manager') === 0;
                $currentApprover = User::find($materialRequestTransaction->assigned_to);
                $requester = User::find($materialRequestTransaction->requester_id);
                $isFinalApproval = $isDirectManagerFlow
                    ? ($requester?->parent_id ? false : true)  // If requester has parent, not final. If no parent, final.
                    : ($materialRequestTransaction->order == $totalRequiredApprovals);
                if (!$isFinalApproval) {
                    $nextOrder = $materialRequestTransaction->order + 1;
                    $nextStep = $processSteps->where('order', $nextOrder)->first();
                    \Log::info('=== ATTEMPTING TO CREATE NEXT APPROVAL TRANSACTION ===', [
                        'material_request_id' => $materialRequestTransaction->material_request_id,
                        'current_order' => $materialRequestTransaction->order,
                        'next_order' => $nextOrder,
                        'next_step_id' => $nextStep ? $nextStep->id : null,
                        'total_steps' => $totalRequiredApprovals
                    ]);
                    if ($nextStep) {
                        // Resolve next approver via ApproverResolver
                        $resolver = new ApproverResolver();
                        $eloquentStep = EloquentProcessStep::find($nextStep->id);
                        $requester = User::find($materialRequestTransaction->requester_id);
                        $resolvedApproverId = $eloquentStep && $requester
                            ? $resolver->resolveApproverId($eloquentStep, $requester)
                            : null;
                        if ($resolvedApproverId) {
                            // Check if transaction already exists for this material request and order
                            $existingTransaction = MaterialRequestTransaction::where('material_request_id', $materialRequestTransaction->material_request_id)
                                ->where('order', $nextOrder)
                                ->where('assigned_to', $resolvedApproverId)
                                ->first();
                            
                            if (!$existingTransaction) {
                                \Log::info('=== CREATING NEXT APPROVAL TRANSACTION ===', [
                                    'material_request_id' => $materialRequestTransaction->material_request_id,
                                    'next_order' => $nextOrder,
                                    'next_approver_id' => $resolvedApproverId
                                ]);
                                $nextTransaction = new 
                                    \App\Models\MaterialRequestTransaction([
                                        'material_request_id' => $materialRequestTransaction->material_request_id,
                                        'requester_id' => $materialRequestTransaction->requester_id,
                                        'assigned_to' => $resolvedApproverId,
                                        'order' => $nextOrder,
                                        'description' => $nextStep->description,
                                        'status' => 'Pending',
                                        'created_by' => auth()->id(),
                                        'updated_by' => auth()->id()
                                    ]);
                                $nextTransaction->save();
                                
                                // Check if task already exists for this material request, process step, and assigned user
                                $existingTask = DB::table('tasks')
                                    ->where('material_request_id', $materialRequestTransaction->material_request_id)
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
                                        'assigned_from_user_id' => $materialRequestTransaction->requester_id,
                                        'read_status' => null,
                                        'material_request_id' => $materialRequestTransaction->material_request_id,
                                        'created_at' => now(),
                                        'updated_at' => now()
                                    ]);
                                } else {
                                    \Log::info('=== TASK ALREADY EXISTS, SKIPPING CREATION ===', [
                                        'material_request_id' => $materialRequestTransaction->material_request_id,
                                        'process_step_id' => $nextStep->id,
                                        'assigned_to_user_id' => $resolvedApproverId
                                    ]);
                                }
                            } else {
                                \Log::info('=== TRANSACTION ALREADY EXISTS, SKIPPING CREATION ===', [
                                    'material_request_id' => $materialRequestTransaction->material_request_id,
                                    'order' => $nextOrder,
                                    'assigned_to' => $resolvedApproverId
                                ]);
                            }

                            // Send task assignment notification only if task was created
                            if (isset($taskId)) {
                                $task = Task::with(['assignedToUser', 'process'])->find($taskId);
                                if ($task) {
                                    $notificationService = new TaskNotificationService();
                                    $notificationService->sendTaskAssignmentNotification($task, 'Material Request');
                                }
                            }
                            
                            // Send intermediate status notification to requester
                            $requesterTask = Task::where('material_request_id', $materialRequestTransaction->material_request_id)
                                ->with(['material_request.requester', 'process'])
                                ->first();
                            
                            if ($requesterTask) {
                                $notificationService = new TaskNotificationService();
                                $requester = $notificationService->getRequesterFromTask($requesterTask);
                                if ($requester) {
                                    $comment = "Approved by " . auth()->user()->name . " (Step " . $materialRequestTransaction->order . ")";
                                    $notificationService->sendIntermediateStatusNotification($requesterTask, 'Material Request', 'Approved', $requester, $comment);
                                }
                            }
                        }
                    }
                } else {
                    // This is the final approval - send final notification to requester
                    $task = Task::where('material_request_id', $materialRequestTransaction->material_request_id)
                        ->with(['material_request.requester', 'process'])
                        ->first();
                    
                    if ($task) {
                        $notificationService = new TaskNotificationService();
                        $requester = $notificationService->getRequesterFromTask($task);
                        if ($requester) {
                            $notificationService->sendFinalStatusNotification($task, 'Material Request', 'Approved', $requester);
                        }
                    }
                }
            } elseif ($request->input('status') === 'Reject') {
                // Send rejection notification to requester
                $task = Task::where('material_request_id', $materialRequestTransaction->material_request_id)
                    ->with(['material_request.requester', 'process'])
                    ->first();
                
                if ($task) {
                    $notificationService = new TaskNotificationService();
                    $requester = $notificationService->getRequesterFromTask($task);
                    if ($requester) {
                        $notificationService->sendFinalStatusNotification($task, 'Material Request', 'Rejected', $requester);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Material request transaction updated successfully',
                'data' => new MaterialRequestTransactionResource(
                    $materialRequestTransaction->load(['materialRequest', 'requester', 'assignedUser', 'referredUser'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update material request transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(MaterialRequestTransaction $materialRequestTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $materialRequestTransaction->delete();

            DB::commit();

            return response()->json([
                'message' => 'Material request transaction deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete material request transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
