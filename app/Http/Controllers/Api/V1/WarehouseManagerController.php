<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\WarehouseManager\StoreWarehouseManagerRequest;
use App\Http\Requests\V1\WarehouseManager\UpdateWarehouseManagerRequest;
use App\Http\Resources\V1\WarehouseManagerResource;
use App\Models\WarehouseManager;
use App\QueryParameters\WarehouseManagerParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class WarehouseManagerController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $warehouseManagers = QueryBuilder::for(WarehouseManager::class)
            ->allowedFilters(WarehouseManagerParameters::ALLOWED_FILTERS)
            ->allowedSorts(WarehouseManagerParameters::ALLOWED_SORTS)
            ->allowedIncludes(WarehouseManagerParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($warehouseManagers->isEmpty()) {
            return response()->json([
                'message' => 'No warehouse managers found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return WarehouseManagerResource::collection($warehouseManagers);
    }

    public function store(StoreWarehouseManagerRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $warehouseManager = WarehouseManager::create($request->validated());

//            $warehouseManager->warehouse->update([
//                'manager_id' => $warehouseManager->manager_id,
//            ]);

            DB::commit();

            return response()->json([
                'message' => 'Warehouse manager assigned successfully',
                'data' => new WarehouseManagerResource(
                    $warehouseManager->load(['warehouse', 'manager'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to assign warehouse manager',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $warehouseManager = QueryBuilder::for(WarehouseManager::class)
            ->allowedIncludes(WarehouseManagerParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new WarehouseManagerResource($warehouseManager)
        ], Response::HTTP_OK);
    }

    public function update(UpdateWarehouseManagerRequest $request, WarehouseManager $warehouseManager): JsonResponse
    {
        try {
            DB::beginTransaction();

            $warehouseManager->update($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Warehouse manager updated successfully',
                'data' => new WarehouseManagerResource(
                    $warehouseManager->load(['warehouse', 'manager'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update warehouse manager',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(WarehouseManager $warehouseManager): JsonResponse
    {
        try {
            DB::beginTransaction();

            $warehouseManager->delete();

            DB::commit();

            return response()->json([
                'message' => 'Warehouse manager removed successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to remove warehouse manager',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
