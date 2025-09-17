<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\MahratInvoiceApprovalTransaction\StoreMahratInvoiceApprovalTransactionRequest;
use App\Http\Requests\V1\MahratInvoiceApprovalTransaction\UpdateMahratInvoiceApprovalTransactionRequest;
use App\Http\Resources\V1\MahratInvoiceApprovalTransactionResource;
use App\Models\MahratInvoiceApprovalTransaction;
use App\Models\Invoice;
use App\Models\Task;
use App\QueryParameters\MahratInvoiceApprovalTransactionParameters;
use App\Services\BudgetRevenueUpdateService;
use App\Services\TaskNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\ProcessStep as EloquentProcessStep;
use App\Models\User;
use App\Services\ApproverResolver;
use Spatie\QueryBuilder\QueryBuilder;

class MahratInvoiceApprovalTransactionController extends Controller
{
    /**
     * Display a listing of the mahrat invoice approval transactions.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $transactions = QueryBuilder::for(MahratInvoiceApprovalTransaction::class)
            ->allowedFilters(MahratInvoiceApprovalTransactionParameters::getAllowedFilters())
            ->allowedSorts(MahratInvoiceApprovalTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(MahratInvoiceApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No mahrat invoice approval transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return MahratInvoiceApprovalTransactionResource::collection($transactions);
    }


    /**
     * Store a newly created mahrat invoice approval transaction.
     */
    public function store(StoreMahratInvoiceApprovalTransactionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();

            // Automatically add current user as creator and updater
            $data['created_by'] = auth()->id();
            $data['updated_by'] = auth()->id();

            $transaction = MahratInvoiceApprovalTransaction::create($data);

            DB::commit();

            return response()->json([
                'message' => 'Mahrat invoice approval transaction created successfully',
                'data' => new MahratInvoiceApprovalTransactionResource(
                    $transaction->load([
                        'invoice',
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
                'message' => 'Failed to create mahrat invoice approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified mahrat invoice approval transaction.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $transaction = QueryBuilder::for(MahratInvoiceApprovalTransaction::class)
                ->allowedIncludes(MahratInvoiceApprovalTransactionParameters::ALLOWED_INCLUDES)
                ->with(['invoice']) // Ensure the invoice relationship is always loaded
                ->findOrFail($id);

            return response()->json([
                'data' => new MahratInvoiceApprovalTransactionResource($transaction)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch invoice details',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }


    /**
     * Update the specified mahrat invoice approval transaction.
     */
    public function update(UpdateMahratInvoiceApprovalTransactionRequest $request, MahratInvoiceApprovalTransaction $mahratInvoiceApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            Log::info('Updating Maharat Invoice approval transaction', [
                'transaction_id' => $mahratInvoiceApprovalTransaction->id,
                'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id,
                'new_status' => $validated['status'],
                'order' => $mahratInvoiceApprovalTransaction->order,
                'validated_data' => $validated
            ]);

            // Set the current user as updater
            $validated['updated_by'] = Auth::id();

            $mahratInvoiceApprovalTransaction->update($validated);

            // If the status is 'Approve', check if this is the final approval
            if ($validated['status'] === 'Approve') {
                $processSteps = DB::table('process_steps')
                    ->join('processes', 'process_steps.process_id', '=', 'processes.id')
                    ->where('processes.title', 'Maharat Invoice Approval')
                    ->orderBy('process_steps.order')
                    ->get();
                $totalRequiredApprovals = $processSteps->count();
                $currentStep = $processSteps->where('order', $mahratInvoiceApprovalTransaction->order)->first();
                $eloquentCurrentStep = $currentStep ? EloquentProcessStep::find($currentStep->id) : null;
                $isDirectManagerFlow = $eloquentCurrentStep && $eloquentCurrentStep->designation && strcasecmp(trim($eloquentCurrentStep->designation->designation), 'Direct Manager') === 0;
                $currentApprover = User::find($mahratInvoiceApprovalTransaction->assigned_to);
                $isFinalApproval = $isDirectManagerFlow
                    ? ($currentApprover?->parent_id ? false : true)
                    : ($mahratInvoiceApprovalTransaction->order == $totalRequiredApprovals);
                if (!$isFinalApproval) {
                    $nextOrder = $mahratInvoiceApprovalTransaction->order + 1;
                    $nextStep = $processSteps->where('order', $nextOrder)->first();
                    if ($isDirectManagerFlow) {
                        $stepIdForTask = $nextStep->id ?? ($currentStep->id ?? null);
                        $resolvedApproverId = $currentApprover?->parent_id;
                        if ($resolvedApproverId && $stepIdForTask) {
                            $nextTransaction = new 
                                \App\Models\MahratInvoiceApprovalTransaction([
                                    'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id,
                                    'requester_id' => $mahratInvoiceApprovalTransaction->requester_id,
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
                                'assigned_from_user_id' => $mahratInvoiceApprovalTransaction->requester_id,
                                'read_status' => null,
                                'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]);
                        }
                    } elseif ($nextStep) {
                        $resolver = new ApproverResolver();
                        $eloquentStep = EloquentProcessStep::find($nextStep->id);
                        $requester = User::find($mahratInvoiceApprovalTransaction->requester_id);
                        $resolvedApproverId = null;
                        if ($eloquentStep && $eloquentStep->designation && strcasecmp(trim($eloquentStep->designation->designation), 'Direct Manager') === 0) {
                            $currentApprover = User::find($mahratInvoiceApprovalTransaction->assigned_to);
                            $resolvedApproverId = $currentApprover?->parent_id;
                        } else {
                            $resolvedApproverId = $eloquentStep && $requester
                                ? $resolver->resolveApproverId($eloquentStep, $requester)
                                : null;
                        }
                        if ($resolvedApproverId) {
                            $nextTransaction = new 
                                \App\Models\MahratInvoiceApprovalTransaction([
                                    'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id,
                                    'requester_id' => $mahratInvoiceApprovalTransaction->requester_id,
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
                                'assigned_to_user_id' => $resolvedApproverId,
                                'assigned_from_user_id' => $mahratInvoiceApprovalTransaction->requester_id,
                                'read_status' => null,
                                'invoice_id' => $mahratInvoiceApprovalTransaction->invoice_id,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]);

                            // Send task assignment notification
                            $task = Task::with(['assignedToUser', 'process'])->find($taskId);
                            if ($task) {
                                $notificationService = new TaskNotificationService();
                                $notificationService->sendTaskAssignmentNotification($task, 'Maharat Invoice Approval');
                            }
                            
                            // Send intermediate status notification to requester
                            $requesterTask = Task::where('invoice_id', $mahratInvoiceApprovalTransaction->invoice_id)
                                ->with(['invoice.creator', 'process'])
                                ->first();
                            
                            if ($requesterTask) {
                                $notificationService = new TaskNotificationService();
                                $requester = $notificationService->getRequesterFromTask($requesterTask);
                                if ($requester) {
                                    $comment = "Approved by " . auth()->user()->name . " (Step " . $mahratInvoiceApprovalTransaction->order . ")";
                                    $notificationService->sendIntermediateStatusNotification($requesterTask, 'Maharat Invoice Approval', 'Approved', $requester, $comment);
                                }
                            }
                        }
                    }
                } else {
                    // This is the final approval - send final notification to requester
                    $task = Task::where('invoice_id', $mahratInvoiceApprovalTransaction->invoice_id)
                        ->with(['invoice.creator', 'process'])
                        ->first();
                    
                    if ($task) {
                        $notificationService = new TaskNotificationService();
                        $requester = $notificationService->getRequesterFromTask($task);
                        if ($requester) {
                            $notificationService->sendFinalStatusNotification($task, 'Maharat Invoice Approval', 'Approved', $requester);
                        }
                    }
                }
            } elseif ($request->input('status') === 'Reject') {
                // Send rejection notification to requester
                $task = Task::where('invoice_id', $mahratInvoiceApprovalTransaction->invoice_id)
                    ->with(['invoice.creator', 'process'])
                    ->first();
                
                if ($task) {
                    $notificationService = new TaskNotificationService();
                    $requester = $notificationService->getRequesterFromTask($task);
                    if ($requester) {
                        $notificationService->sendFinalStatusNotification($task, 'Maharat Invoice Approval', 'Rejected', $requester);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Maharat invoice approval transaction updated successfully',
                'data' => new MahratInvoiceApprovalTransactionResource(
                    $mahratInvoiceApprovalTransaction->load([
                        'invoice',
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
            Log::error('Failed to update Maharat invoice approval transaction', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to update Maharat invoice approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified mahrat invoice approval transaction.
     */
    public function destroy(MahratInvoiceApprovalTransaction $mahratInvoiceApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $mahratInvoiceApprovalTransaction->delete();

            DB::commit();

            return response()->json([
                'message' => 'Mahrat invoice approval transaction deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete mahrat invoice approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
