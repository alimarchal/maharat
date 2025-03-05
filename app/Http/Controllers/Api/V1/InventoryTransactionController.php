<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\InventoryTransaction;
use App\Http\Resources\V1\InventoryTransactionResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\QueryBuilder;

class InventoryTransactionController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $transactions = QueryBuilder::for(InventoryTransaction::class)
            ->allowedFilters(['inventory_id', 'transaction_type', 'user_id'])
            ->allowedSorts(['created_at', 'transaction_type', 'quantity'])
            ->allowedIncludes(['inventory', 'inventory.product', 'inventory.warehouse', 'user'])
            ->paginate()
            ->appends(request()->query());

        if ($transactions->isEmpty()) {
            return response()->json([
                'message' => 'No inventory transactions found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return InventoryTransactionResource::collection($transactions);
    }

    public function show(string $id): JsonResponse
    {
        $transaction = QueryBuilder::for(InventoryTransaction::class)
            ->allowedIncludes(['inventory', 'inventory.product', 'inventory.warehouse', 'user'])
            ->findOrFail($id);

        return response()->json([
            'data' => new InventoryTransactionResource($transaction)
        ], Response::HTTP_OK);
    }
}
