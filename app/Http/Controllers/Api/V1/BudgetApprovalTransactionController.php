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
