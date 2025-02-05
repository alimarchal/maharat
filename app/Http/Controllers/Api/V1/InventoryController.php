<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Inventory\StoreInventoryRequest;
use App\Http\Requests\V1\Inventory\UpdateInventoryRequest;
use App\Http\Resources\V1\InventoryResource;
use App\Models\Inventory;
use App\QueryParameters\InventoryParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\QueryBuilder;

class InventoryController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $inventories = QueryBuilder::for(Inventory::class)
            ->allowedFilters(InventoryParameters::ALLOWED_FILTERS)
            ->allowedSorts(InventoryParameters::ALLOWED_SORTS)
            ->allowedIncludes(InventoryParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($inventories->isEmpty()) {
            return response()->json([
                'message' => 'No inventories found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return InventoryResource::collection($inventories);
    }

    public function store(StoreInventoryRequest $request): JsonResponse
    {
        try {
            $inventory = Inventory::create($request->validated());

            return response()->json([
                'message' => 'Inventory created successfully',
                'data' => new InventoryResource($inventory->load(['warehouse', 'product']))
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create inventory',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $inventory = QueryBuilder::for(Inventory::class)
            ->allowedIncludes(InventoryParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new InventoryResource($inventory)
        ], Response::HTTP_OK);
    }

    public function update(UpdateInventoryRequest $request, Inventory $inventory): JsonResponse
    {
        try {
            $inventory->update($request->validated());

            return response()->json([
                'message' => 'Inventory updated successfully',
                'data' => new InventoryResource($inventory->load(['warehouse', 'product']))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update inventory',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(Inventory $inventory): JsonResponse
    {
        try {
            $inventory->delete();

            return response()->json([
                'message' => 'Inventory deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete inventory',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
