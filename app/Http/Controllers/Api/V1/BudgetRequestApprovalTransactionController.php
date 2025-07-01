<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\BudgetRequestApprovalTransaction\StoreBudgetRequestApprovalTransactionRequest;
use App\Http\Requests\V1\BudgetRequestApprovalTransaction\UpdateBudgetRequestApprovalTransactionRequest;
use App\Http\Resources\V1\BudgetRequestApprovalTransactionResource;
use App\Models\BudgetRequestApprovalTransaction;
use App\Models\RequestBudget;
use App\Models\Budget;
use App\QueryParameters\BudgetRequestApprovalTransactionParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Spatie\QueryBuilder\QueryBuilder;

class BudgetRequestApprovalTransactionController extends Controller
{
    /**
     * Display a listing of budget request approval transactions.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $transactions = QueryBuilder::for(BudgetRequestApprovalTransaction::class)
            ->allowedFilters(BudgetRequestApprovalTransactionParameters::ALLOWED_FILTERS)
            ->allowedSorts(BudgetRequestApprovalTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(BudgetRequestApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No budget request approval transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return BudgetRequestApprovalTransactionResource::collection($transactions);
    }

    /**
     * Store a newly created budget request approval transaction.
     */
    public function store(StoreBudgetRequestApprovalTransactionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();

            // Automatically add current user as creator and updater
            $data['created_by'] = auth()->id();
            $data['updated_by'] = auth()->id();

            $transaction = BudgetRequestApprovalTransaction::create($data);

            DB::commit();

            return response()->json([
                'message' => 'Budget request approval transaction created successfully',
                'data' => new BudgetRequestApprovalTransactionResource(
                    $transaction->load([
                        'requestBudget',
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
                'message' => 'Failed to create budget request approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified budget request approval transaction.
     */
    public function show(string $id): JsonResponse
    {
        $transaction = QueryBuilder::for(BudgetRequestApprovalTransaction::class)
            ->allowedIncludes(BudgetRequestApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new BudgetRequestApprovalTransactionResource($transaction)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified budget request approval transaction.
     */
    public function update(UpdateBudgetRequestApprovalTransactionRequest $request, BudgetRequestApprovalTransaction $budgetRequestApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();
            Log::info('Updating Budget Request approval transaction', [
                'transaction_id' => $budgetRequestApprovalTransaction->id,
                'request_budget_id' => $budgetRequestApprovalTransaction->request_budgets_id,
                'new_status' => $validated['status'],
                'order' => $budgetRequestApprovalTransaction->order,
                'validated_data' => $validated
            ]);

            // Set the current user as updater
            $validated['updated_by'] = Auth::id();

            $budgetRequestApprovalTransaction->update($validated);

            // If the status is 'Approve', check if this is the final approval
            if ($validated['status'] === 'Approve') {
                Log::info('Approval detected, checking if final approval', [
                    'request_budget_id' => $budgetRequestApprovalTransaction->request_budgets_id,
                    'current_status' => DB::table('request_budgets')->where('id', $budgetRequestApprovalTransaction->request_budgets_id)->value('status'),
                    'approval_order' => $budgetRequestApprovalTransaction->order
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
                $isFinalApproval = $budgetRequestApprovalTransaction->order == $totalRequiredApprovals;

                Log::info('Approval status check', [
                    'request_budget_id' => $budgetRequestApprovalTransaction->request_budgets_id,
                    'current_order' => $budgetRequestApprovalTransaction->order,
                    'total_required_approvals' => $totalRequiredApprovals,
                    'is_final_approval' => $isFinalApproval,
                    'process_steps_count' => $processSteps->count()
                ]);

                // === NEW LOGIC: If not final approval, create next approval transaction and task ===
                if (!$isFinalApproval) {
                    $nextOrder = $budgetRequestApprovalTransaction->order + 1;
                    $nextStep = $processSteps->where('order', $nextOrder)->first();
                    if ($nextStep) {
                        // Find the next approver (assume a method or logic exists to get approver by step and request budget)
                        $nextApprover = DB::table('users')
                            ->join('process_step_user', 'users.id', '=', 'process_step_user.user_id')
                            ->where('process_step_user.process_step_id', $nextStep->id)
                            ->select('users.id')
                            ->first();
                        if ($nextApprover) {
                            // Create next approval transaction
                            $nextTransaction = new 
                                \App\Models\BudgetRequestApprovalTransaction([
                                    'request_budgets_id' => $budgetRequestApprovalTransaction->request_budgets_id,
                                    'requester_id' => $budgetRequestApprovalTransaction->requester_id,
                                    'assigned_to' => $nextApprover->id,
                                    'order' => $nextOrder,
                                    'description' => $nextStep->description,
                                    'status' => 'Pending',
                                    'created_by' => Auth::id(),
                                    'updated_by' => Auth::id()
                                ]);
                            $nextTransaction->save();
                            // Create next task (assume a Task model exists)
                            DB::table('tasks')->insert([
                                'process_step_id' => $nextStep->id,
                                'process_id' => $nextStep->process_id,
                                'assigned_at' => now(),
                                'urgency' => 'Normal',
                                'assigned_to_user_id' => $nextApprover->id,
                                'assigned_from_user_id' => $budgetRequestApprovalTransaction->requester_id,
                                'read_status' => null,
                                'material_request_id' => null,
                                'request_budgets_id' => $budgetRequestApprovalTransaction->request_budgets_id,
                                'created_at' => now(),
                                'updated_at' => now()
                            ]);
                            Log::info('Created next approval transaction and task for next approver', [
                                'request_budget_id' => $budgetRequestApprovalTransaction->request_budgets_id,
                                'next_order' => $nextOrder,
                                'next_approver_id' => $nextApprover->id
                            ]);
                        } else {
                            Log::warning('No next approver found for next process step', [
                                'request_budget_id' => $budgetRequestApprovalTransaction->request_budgets_id,
                                'next_order' => $nextOrder
                            ]);
                        }
                    } else {
                        Log::warning('No next process step found for next order', [
                            'request_budget_id' => $budgetRequestApprovalTransaction->request_budgets_id,
                            'next_order' => $nextOrder
                        ]);
                    }
                }
                // === END NEW LOGIC ===
            } elseif ($validated['status'] === 'Reject') {
                // If rejected, immediately update budget request status to Rejected
                Log::info('Rejection detected, updating Budget Request status to Rejected', [
                    'request_budget_id' => $budgetRequestApprovalTransaction->request_budgets_id,
                    'approval_order' => $budgetRequestApprovalTransaction->order
                ]);

                try {
                    // Update the budget request status to Rejected
                    $budgetRequestUpdated = DB::table('request_budgets')
                        ->where('id', $budgetRequestApprovalTransaction->request_budgets_id)
                        ->update([
                            'status' => 'Rejected',
                            'updated_at' => now()
                        ]);

                    Log::info('Budget Request rejection status update result', [
                        'request_budget_id' => $budgetRequestApprovalTransaction->request_budgets_id,
                        'update_success' => $budgetRequestUpdated,
                        'new_status' => DB::table('request_budgets')->where('id', $budgetRequestApprovalTransaction->request_budgets_id)->value('status')
                    ]);

                } catch (\Exception $e) {
                    Log::error('Failed to update Budget Request status for rejection', [
                        'request_budget_id' => $budgetRequestApprovalTransaction->request_budgets_id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            } else {
                Log::info('Not an approval or rejection status', [
                    'status' => $validated['status'],
                    'request_budget_id' => $budgetRequestApprovalTransaction->request_budgets_id
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Budget request approval transaction updated successfully',
                'data' => new BudgetRequestApprovalTransactionResource(
                    $budgetRequestApprovalTransaction->load([
                        'requestBudget',
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
            Log::error('Failed to update Budget Request approval transaction', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to update Budget Request approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified budget request approval transaction.
     */
    public function destroy(BudgetRequestApprovalTransaction $budgetRequestApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $budgetRequestApprovalTransaction->delete();

            DB::commit();

            return response()->json([
                'message' => 'Budget request approval transaction deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete budget request approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
