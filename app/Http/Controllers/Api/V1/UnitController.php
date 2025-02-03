<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Unit\StoreUnitRequest;
use App\Http\Requests\V1\Unit\UpdateUnitRequest;
use App\Http\Resources\V1\UnitResource;
use App\Models\Unit;
use App\QueryParameters\UnitParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\QueryBuilder;

class UnitController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $units = QueryBuilder::for(Unit::class)
            ->allowedFilters(UnitParameters::ALLOWED_FILTERS)
            ->allowedSorts(UnitParameters::ALLOWED_SORTS)
            ->paginate()
            ->appends(request()->query());

        if ($units->isEmpty()) {
            return response()->json([
                'message' => 'No units found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return UnitResource::collection($units);
    }

    public function store(StoreUnitRequest $request): JsonResponse
    {
        try {
            $unit = Unit::create($request->validated());

            return response()->json([
                'message' => 'Unit created successfully',
                'data' => new UnitResource($unit)
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create unit',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $unit = QueryBuilder::for(Unit::class)
            ->allowedIncludes(UnitParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new UnitResource($unit)
        ], Response::HTTP_OK);
    }

    public function update(UpdateUnitRequest $request, Unit $unit): JsonResponse
    {
        try {
            $unit->update($request->validated());

            return response()->json([
                'message' => 'Unit updated successfully',
                'data' => new UnitResource($unit)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update unit',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(Unit $unit): JsonResponse
    {
        try {
            $unit->delete();

            return response()->json([
                'message' => 'Unit deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete unit',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
