<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Warehouse\StoreWarehouseRequest;
use App\Http\Requests\V1\Warehouse\UpdateWarehouseRequest;
use App\Http\Resources\V1\WarehouseResource;
use App\Models\Warehouse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Http\Resources\Json\ResourceCollection;
use App\QueryParameters\WarehouseParameters;
use Spatie\QueryBuilder\QueryBuilder;

class WarehouseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        try {
            // Add debugging to see what's happening
            $query = QueryBuilder::for(Warehouse::class);

            // Log the SQL query to see what's being executed
            \Log::info('Warehouse Query: ' . $query->toSql());

            $warehouses = $query
                ->allowedFilters(WarehouseParameters::ALLOWED_FILTERS)
                ->allowedSorts(WarehouseParameters::ALLOWED_SORTS)
                ->allowedIncludes(WarehouseParameters::ALLOWED_INCLUDES)
                ->paginate()
                ->appends(request()->query());

            // Check what's being returned
            \Log::info('Warehouse Count: ' . $warehouses->count());

            if ($warehouses->isEmpty()) {
                return response()->json([
                    'message' => 'No warehouses found',
                    'data' => []
                ], Response::HTTP_OK);
            }

            return response()->json([
                'message' => 'List of warehouses',
                'data' => WarehouseResource::collection($warehouses)
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            // Log the exception to understand what's failing
            \Log::error('Warehouse Error: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());

            return response()->json([
                'message' => 'No warehouses found',
                'data' => []
            ]);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreWarehouseRequest $request): JsonResponse
    {
        try {
            $warehouse = Warehouse::create($request->validated());

            return response()->json([
                'message' => 'Warehouse created successfully',
                'data' => new WarehouseResource($warehouse->load('manager'))
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create warehouse',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $warehouse = QueryBuilder::for(Warehouse::class)
            ->allowedIncludes(WarehouseParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new WarehouseResource($warehouse)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateWarehouseRequest $request, Warehouse $warehouse): JsonResponse
    {
        try {
            $warehouse->update($request->validated());

            return response()->json([
                'message' => 'Warehouse updated successfully',
                'data' => new WarehouseResource($warehouse->load('manager'))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update warehouse',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Warehouse $warehouse): JsonResponse
    {
        try {
            $warehouse->delete();

            return response()->json([
                'message' => 'Warehouse deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete warehouse',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
