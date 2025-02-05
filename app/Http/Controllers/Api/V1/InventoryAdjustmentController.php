<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\InventoryAdjustment\StoreInventoryAdjustmentRequest;
use App\Http\Requests\V1\InventoryAdjustment\UpdateInventoryAdjustmentRequest;
use App\Http\Resources\V1\InventoryAdjustmentResource;
use App\Models\InventoryAdjustment;
use App\QueryParameters\InventoryAdjustmentParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\QueryBuilder;

class InventoryAdjustmentController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $adjustments = QueryBuilder::for(InventoryAdjustment::class)
            ->allowedFilters(InventoryAdjustmentParameters::ALLOWED_FILTERS)
            ->allowedSorts(InventoryAdjustmentParameters::ALLOWED_SORTS)
            ->allowedIncludes(InventoryAdjustmentParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($adjustments->isEmpty()) {
            return response()->json([
                'message' => 'No inventory adjustments found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return InventoryAdjustmentResource::collection($adjustments);
    }

    public function store(StoreInventoryAdjustmentRequest $request): JsonResponse
    {
        try {
            $adjustment = InventoryAdjustment::create($request->validated());

            return response()->json([
                'message' => 'Inventory adjustment created successfully',
                'data' => new InventoryAdjustmentResource(
                    $adjustment->load(['warehouse', 'product', 'reasonStatus', 'approvedBy'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create inventory adjustment',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $adjustment = QueryBuilder::for(InventoryAdjustment::class)
            ->allowedIncludes(InventoryAdjustmentParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new InventoryAdjustmentResource($adjustment)
        ], Response::HTTP_OK);
    }

    public function update(UpdateInventoryAdjustmentRequest $request, InventoryAdjustment $inventoryAdjustment): JsonResponse
    {
        try {
            $inventoryAdjustment->update($request->validated());

            return response()->json([
                'message' => 'Inventory adjustment updated successfully',
                'data' => new InventoryAdjustmentResource(
                    $inventoryAdjustment->load(['warehouse', 'product', 'reasonStatus', 'approvedBy'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update inventory adjustment',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(InventoryAdjustment $inventoryAdjustment): JsonResponse
    {
        try {
            $inventoryAdjustment->delete();

            return response()->json([
                'message' => 'Inventory adjustment deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete inventory adjustment',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
