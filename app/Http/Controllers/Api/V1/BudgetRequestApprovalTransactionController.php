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

                // Get total number of required approvals for this budget request
                $totalApprovals = DB::table('budget_request_approval_transactions')
                    ->where('request_budgets_id', $budgetRequestApprovalTransaction->request_budgets_id)
                    ->count();

                // Count how many approvals have been completed
                $completedApprovals = DB::table('budget_request_approval_transactions')
                    ->where('request_budgets_id', $budgetRequestApprovalTransaction->request_budgets_id)
                    ->where('status', 'Approve')
                    ->count();

                // Check if this is the final approval (all transactions are approved)
                $isFinalApproval = $completedApprovals === $totalApprovals;

                Log::info('Approval status check', [
                    'request_budget_id' => $budgetRequestApprovalTransaction->request_budgets_id,
                    'current_order' => $budgetRequestApprovalTransaction->order,
                    'total_approvals' => $totalApprovals,
                    'completed_approvals' => $completedApprovals,
                    'is_final_approval' => $isFinalApproval
                ]);

                // Update budget request status based on approval stage
                if ($isFinalApproval) {
                    Log::info('Final approval detected, updating Budget Request status to Approved', [
                        'request_budget_id' => $budgetRequestApprovalTransaction->request_budgets_id,
                        'approval_order' => $budgetRequestApprovalTransaction->order,
                        'total_approvals' => $totalApprovals,
                        'completed_approvals' => $completedApprovals
                    ]);

                    try {
                        // Update the budget request status to Approved
                        $budgetRequestUpdated = DB::table('request_budgets')
                            ->where('id', $budgetRequestApprovalTransaction->request_budgets_id)
                            ->update([
                                'status' => 'Approved',
                                'reserved_amount' => DB::raw('revenue_planned'),
                                'balance_amount' => DB::raw('revenue_planned'),
                                'updated_at' => now()
                            ]);

                        Log::info('Budget Request status update result', [
                            'request_budget_id' => $budgetRequestApprovalTransaction->request_budgets_id,
                            'update_success' => $budgetRequestUpdated,
                            'new_status' => DB::table('request_budgets')->where('id', $budgetRequestApprovalTransaction->request_budgets_id)->value('status')
                        ]);

                        if ($budgetRequestUpdated) {
                            // Create budget in budgets table from approved budget request
                            $budgetRequest = RequestBudget::find($budgetRequestApprovalTransaction->request_budgets_id);
                            
                            if ($budgetRequest) {
                                Log::info('Creating budget from approved budget request', [
                                    'request_budget_id' => $budgetRequest->id,
                                    'fiscal_period_id' => $budgetRequest->fiscal_period_id,
                                    'cost_center_id' => $budgetRequest->cost_center_id,
                                    'sub_cost_center_id' => $budgetRequest->sub_cost_center
                                ]);

                                // Always create a new budget for the approved budget request
                                $newBudget = Budget::create([
                                    'fiscal_period_id' => $budgetRequest->fiscal_period_id,
                                    'department_id' => $budgetRequest->department_id,
                                    'cost_center_id' => $budgetRequest->cost_center_id,
                                    'sub_cost_center_id' => $budgetRequest->sub_cost_center,
                                    'description' => 'Budget created from approved budget request',
                                    'total_revenue_planned' => $budgetRequest->revenue_planned,
                                    'total_revenue_actual' => 0,
                                    'total_expense_planned' => $budgetRequest->requested_amount,
                                    'total_expense_actual' => 0,
                                    'status' => 'Active',
                                    'attachment_path' => $budgetRequest->attachment_path,
                                    'original_name' => $budgetRequest->original_name,
                                    'created_by' => Auth::id(),
                                    'updated_by' => Auth::id()
                                ]);

                                // Update the budget request to link to the new budget
                                $budgetRequest->update([
                                    'budget_id' => $newBudget->id
                                ]);

                                Log::info('New budget created successfully', [
                                    'request_budget_id' => $budgetRequest->id,
                                    'new_budget_id' => $newBudget->id
                                ]);
                            }
                        }

                    } catch (\Exception $e) {
                        Log::error('Failed to update Budget Request status or create budget', [
                            'request_budget_id' => $budgetRequestApprovalTransaction->request_budgets_id,
                            'error' => $e->getMessage(),
                            'trace' => $e->getTraceAsString()
                        ]);
                    }
                } else {
                    Log::info('Not final approval yet, updating Budget Request status to Pending', [
                        'request_budget_id' => $budgetRequestApprovalTransaction->request_budgets_id,
                        'current_order' => $budgetRequestApprovalTransaction->order,
                        'total_approvals' => $totalApprovals,
                        'completed_approvals' => $completedApprovals
                    ]);

                    // Update budget request status to Pending
                    $budgetRequestUpdated = DB::table('request_budgets')
                        ->where('id', $budgetRequestApprovalTransaction->request_budgets_id)
                        ->update([
                            'status' => 'Pending',
                            'updated_at' => now()
                        ]);

                    Log::info('Budget Request status update to Pending result', [
                        'request_budget_id' => $budgetRequestApprovalTransaction->request_budgets_id,
                        'update_success' => $budgetRequestUpdated,
                        'new_status' => DB::table('request_budgets')->where('id', $budgetRequestApprovalTransaction->request_budgets_id)->value('status')
                    ]);
                }
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
