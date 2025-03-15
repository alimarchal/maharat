<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\BudgetRequestApprovalTransaction\StoreBudgetRequestApprovalTransactionRequest;
use App\Http\Requests\V1\BudgetRequestApprovalTransaction\UpdateBudgetRequestApprovalTransactionRequest;
use App\Http\Resources\V1\BudgetRequestApprovalTransactionResource;
use App\Models\BudgetRequestApprovalTransaction;
use App\QueryParameters\BudgetRequestApprovalTransactionParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
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

            $data = $request->validated();

            // Automatically add current user as updater
            $data['updated_by'] = auth()->id();

            $budgetRequestApprovalTransaction->update($data);

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
            return response()->json([
                'message' => 'Failed to update budget request approval transaction',
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
