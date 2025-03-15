<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\RfqApprovalTransaction\StoreRfqApprovalTransactionRequest;
use App\Http\Requests\V1\RfqApprovalTransaction\UpdateRfqApprovalTransactionRequest;
use App\Http\Resources\V1\RfqApprovalTransactionResource;
use App\Models\RfqApprovalTransaction;
use App\QueryParameters\RfqApprovalTransactionParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

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

            // Set the current user as updater
            $validated['updated_by'] = Auth::id();

            $rfqApprovalTransaction->update($validated);

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
