<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\GrnApprovalTransaction\StoreGrnApprovalTransactionRequest;
use App\Http\Requests\V1\GrnApprovalTransaction\UpdateGrnApprovalTransactionRequest;
use App\Http\Resources\V1\GrnApprovalTransactionResource;
use App\Models\GrnApprovalTransaction;
use App\QueryParameters\GrnApprovalTransactionParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Support\Facades\Log;

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