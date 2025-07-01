<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\BudgetApprovalTransaction\StoreBudgetApprovalTransactionRequest;
use App\Http\Requests\V1\BudgetApprovalTransaction\UpdateBudgetApprovalTransactionRequest;
use App\Http\Resources\V1\BudgetApprovalTransactionResource;
use App\Models\BudgetApprovalTransaction;
use App\QueryParameters\BudgetApprovalTransactionParameters;
use App\Services\BudgetApprovalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

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

            // If the status is 'Approve', check if this is the final approval
            if (isset($data['status']) && $data['status'] === 'Approve') {
                $processSteps = DB::table('process_steps')
                    ->join('processes', 'process_steps.process_id', '=', 'processes.id')
                    ->where('processes.title', 'Total Budget Approval')
                    ->orderBy('process_steps.order')
                    ->get();
                $totalRequiredApprovals = $processSteps->count();
                $isFinalApproval = $budgetApprovalTransaction->order == $totalRequiredApprovals;
                if (!$isFinalApproval) {
                    $nextOrder = $budgetApprovalTransaction->order + 1;
                    $nextStep = $processSteps->where('order', $nextOrder)->first();
                    if ($nextStep) {
                        $nextApprover = DB::table('users')
                            ->join('process_step_user', 'users.id', '=', 'process_step_user.user_id')
                            ->where('process_step_user.process_step_id', $nextStep->id)
                            ->select('users.id')
                            ->first();
                        if ($nextApprover) {
                            $nextTransaction = new 
                                \App\Models\BudgetApprovalTransaction([
                                    'budget_id' => $budgetApprovalTransaction->budget_id,
                                    'requester_id' => $budgetApprovalTransaction->requester_id,
                                    'assigned_to' => $nextApprover->id,
                                    'order' => $nextOrder,
                                    'description' => $nextStep->description,
                                    'status' => 'Pending',
                                    'created_by' => auth()->id(),
                                    'updated_by' => auth()->id()
                                ]);
                            $nextTransaction->save();
                            DB::table('tasks')->insert([
                                'process_step_id' => $nextStep->id,
                                'process_id' => $nextStep->process_id,
                                'assigned_at' => now(),
                                'urgency' => 'Normal',
                                'assigned_to_user_id' => $nextApprover->id,
                                'assigned_from_user_id' => $budgetApprovalTransaction->requester_id,
                                'read_status' => null,
                                'budget_id' => $budgetApprovalTransaction->budget_id,
                                'created_at' => now(),
                                'updated_at' => now()
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
