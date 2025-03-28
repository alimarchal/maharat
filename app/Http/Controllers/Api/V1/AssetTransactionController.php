<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\AssetTransaction\StoreAssetTransactionRequest;
use App\Http\Requests\V1\AssetTransaction\UpdateAssetTransactionRequest;
use App\Http\Resources\V1\AssetTransactionResource;
use App\Http\Resources\V1\AssetTransactionCollection;
use App\Models\Asset;
use App\Models\AssetTransaction;
use App\QueryParameters\AssetTransactionParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class AssetTransactionController extends Controller
{
    /**
     * Display a listing of asset transactions.
     */
    public function index(): JsonResponse|AssetTransactionCollection
    {
        $transactions = QueryBuilder::for(AssetTransaction::class)
            ->allowedFilters(AssetTransactionParameters::ALLOWED_FILTERS)
            ->allowedSorts(AssetTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(AssetTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No asset transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return new AssetTransactionCollection($transactions);
    }

    /**
     * Store a newly created asset transaction in storage.
     */
    public function store(StoreAssetTransactionRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Generate reference number if not provided
            if (!isset($validated['reference_number'])) {
                $validated['reference_number'] = AssetTransaction::generateReferenceNumber($validated['transaction_type']);
            }

            $transaction = AssetTransaction::create($validated);

            // Update asset based on transaction type
            $asset = Asset::findOrFail($validated['asset_id']);

            switch ($validated['transaction_type']) {
                case 'acquisition':
                    // For acquisition, we typically don't modify the asset as it should already be set up
                    break;

                case 'depreciation':
                    // Update current value based on depreciation
                    $asset->current_value = max(0, $asset->current_value - $validated['amount']);
                    $asset->save();
                    break;

                case 'revaluation':
                    // Update current value based on revaluation (can be positive or negative)
                    $asset->current_value += $validated['amount'];
                    $asset->save();
                    break;

                case 'maintenance':
                    // Maintenance typically doesn't affect the value
                    break;

                case 'disposal':
                    // Set asset as disposed
                    $asset->status = 'disposed';
                    $asset->disposal_date = $validated['transaction_date'];
                    $asset->current_value = 0;
                    $asset->save();
                    break;

                case 'transfer':
                    // Transfer typically involves location change, would be handled through additional fields
                    break;
            }

            DB::commit();

            return response()->json([
                'message' => 'Asset transaction created successfully',
                'data' => new AssetTransactionResource($transaction->load(['asset', 'creator']))
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create asset transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified asset transaction.
     */
    public function show(AssetTransaction $assetTransaction): JsonResponse
    {
        return response()->json([
            'data' => new AssetTransactionResource($assetTransaction->load(['asset', 'creator']))
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified asset transaction in storage.
     */
    public function update(UpdateAssetTransactionRequest $request, AssetTransaction $assetTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Get the old values before update for possible rollback of asset changes
            $oldTransaction = $assetTransaction->toArray();

            $assetTransaction->update($request->validated());

            // Check if transaction type or amount changed, as we may need to update the asset
            if ($request->has('transaction_type') || $request->has('amount') || $request->has('transaction_date')) {
                $asset = $assetTransaction->asset;

                // Complex logic would be needed here to properly handle changes to transaction types
                // For this example, we'll simply ensure the asset status matches disposal transactions
                if ($assetTransaction->transaction_type === 'disposal') {
                    $asset->status = 'disposed';
                    $asset->disposal_date = $assetTransaction->transaction_date;
                    $asset->save();
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Asset transaction updated successfully',
                'data' => new AssetTransactionResource($assetTransaction->load(['asset', 'creator']))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to update asset transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified asset transaction from storage.
     */
    public function destroy(AssetTransaction $assetTransaction): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Consider the impact of deleting a transaction on the asset
            // For a real system, you might want to rollback any changes the transaction made
            // to the asset, but this would require careful tracking of all changes

            $assetTransaction->delete();

            DB::commit();

            return response()->json([
                'message' => 'Asset transaction deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to delete asset transaction',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get all transactions for a specific asset.
     */
    public function getAssetTransactions(Asset $asset): JsonResponse|AssetTransactionCollection
    {
        $transactions = QueryBuilder::for(AssetTransaction::class)
            ->where('asset_id', $asset->id)
            ->allowedSorts(AssetTransactionParameters::ALLOWED_SORTS)
            ->allowedIncludes(AssetTransactionParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No transactions found for this asset',
                'data' => []
            ], Response::HTTP_OK);
        }

        return new AssetTransactionCollection($transactions);
    }
}
