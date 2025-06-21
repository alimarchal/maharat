<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\PoApprovalTransaction\StorePoApprovalTransactionRequest;
use App\Http\Requests\V1\PoApprovalTransaction\UpdatePoApprovalTransactionRequest;
use App\Http\Resources\V1\PoApprovalTransactionResource;
use App\Models\PoApprovalTransaction;
use App\QueryParameters\PoApprovalTransactionParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class PoApprovalTransactionController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $transactions = QueryBuilder::for(PoApprovalTransaction::class)
            ->allowedFilters(PoApprovalTransactionParameters::ALLOWED_FILTERS)
            ->allowedFilters(
                PoApprovalTransactionParameters::ALLOWED_FILTERS_EXACT
            )
            ->allowedSorts(PoApprovalTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(PoApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No purchase order approval transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return PoApprovalTransactionResource::collection($transactions);
    }

    public function store(StorePoApprovalTransactionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Set the current user as creator if not provided
            if (!isset($validated['created_by'])) {
                $validated['created_by'] = Auth::id();
            }

            $transaction = PoApprovalTransaction::create($validated);

            DB::commit();

            return response()->json([
                'message' => 'Purchase order approval transaction created successfully',
                'data' => new PoApprovalTransactionResource(
                    $transaction->load([
                        'purchaseOrder',
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
                'message' => 'Failed to create purchase order approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $transaction = QueryBuilder::for(PoApprovalTransaction::class)
            ->allowedIncludes(PoApprovalTransactionParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new PoApprovalTransactionResource($transaction)
        ], Response::HTTP_OK);
    }

    public function update(UpdatePoApprovalTransactionRequest $request, PoApprovalTransaction $poApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Set the current user as updater
            $validated['updated_by'] = Auth::id();

            $poApprovalTransaction->update($validated);

            // Update purchase order status based on approval transaction status
            if (isset($validated['status'])) {
                $purchaseOrder = $poApprovalTransaction->purchaseOrder;
                if ($purchaseOrder) {
                    $newStatus = null;
                    
                    if ($validated['status'] === 'Approve') {
                        $newStatus = 'Approved';
                    } elseif ($validated['status'] === 'Reject') {
                        $newStatus = 'Rejected';
                    }
                    
                    if ($newStatus) {
                        $purchaseOrder->update(['status' => $newStatus]);
                        
                        // If rejected, release the reserved budget
                        if ($newStatus === 'Rejected' && $purchaseOrder->request_budget_id) {
                            $budgetService = new \App\Services\BudgetValidationService();
                            $budget = \App\Models\RequestBudget::find($purchaseOrder->request_budget_id);
                            if ($budget) {
                                $budgetService->releaseBudget($budget, $purchaseOrder->amount);
                            }
                        }
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Purchase order approval transaction updated successfully',
                'data' => new PoApprovalTransactionResource(
                    $poApprovalTransaction->load([
                        'purchaseOrder',
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
            return response()->json([
                'message' => 'Failed to update purchase order approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(PoApprovalTransaction $poApprovalTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            $poApprovalTransaction->delete();

            DB::commit();

            return response()->json([
                'message' => 'Purchase order approval transaction deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete purchase order approval transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
