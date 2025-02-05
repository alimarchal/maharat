<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\InventoryTransfer\StoreInventoryTransferRequest;
use App\Http\Requests\V1\InventoryTransfer\UpdateInventoryTransferRequest;
use App\Http\Resources\V1\InventoryTransferResource;
use App\Models\InventoryTransfer;
use App\QueryParameters\InventoryTransferParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\QueryBuilder;

class InventoryTransferController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $transfers = QueryBuilder::for(InventoryTransfer::class)
            ->allowedFilters(InventoryTransferParameters::ALLOWED_FILTERS)
            ->allowedSorts(InventoryTransferParameters::ALLOWED_SORTS)
            ->allowedIncludes(InventoryTransferParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($transfers->isEmpty()) {
            return response()->json([
                'message' => 'No inventory transfers found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return InventoryTransferResource::collection($transfers);
    }

    public function store(StoreInventoryTransferRequest $request): JsonResponse
    {
        try {
            $transfer = InventoryTransfer::create($request->validated());

            return response()->json([
                'message' => 'Inventory transfer created successfully',
                'data' => new InventoryTransferResource(
                    $transfer->load(['fromWarehouse', 'toWarehouse', 'product', 'reasonStatus'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create inventory transfer',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $transfer = QueryBuilder::for(InventoryTransfer::class)
            ->allowedIncludes(InventoryTransferParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new InventoryTransferResource($transfer)
        ], Response::HTTP_OK);
    }

    public function update(UpdateInventoryTransferRequest $request, InventoryTransfer $inventoryTransfer): JsonResponse
    {
        try {
            $inventoryTransfer->update($request->validated());

            return response()->json([
                'message' => 'Inventory transfer updated successfully',
                'data' => new InventoryTransferResource(
                    $inventoryTransfer->load(['fromWarehouse', 'toWarehouse', 'product', 'reasonStatus'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update inventory transfer',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(InventoryTransfer $inventoryTransfer): JsonResponse
    {
        try {
            $inventoryTransfer->delete();

            return response()->json([
                'message' => 'Inventory transfer deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete inventory transfer',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
