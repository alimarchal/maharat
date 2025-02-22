<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Brand\StoreBrandRequest;
use App\Http\Requests\V1\Brand\UpdateBrandRequest;
use App\Http\Resources\V1\BrandResource;
use App\Models\Brand;
use App\QueryParameters\BrandParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class BrandController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $brands = QueryBuilder::for(Brand::class)
            ->allowedFilters(BrandParameters::ALLOWED_FILTERS)
            ->allowedSorts(BrandParameters::ALLOWED_SORTS)
            ->allowedIncludes(BrandParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($brands->isEmpty()) {
            return response()->json([
                'message' => 'No brands found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return BrandResource::collection($brands);
    }

    public function store(StoreBrandRequest $request): JsonResponse
    {
        try {
            $brand = Brand::create($request->validated());

            return response()->json([
                'message' => 'Brand created successfully',
                'data' => new BrandResource($brand->load('status'))
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create brand',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $brand = QueryBuilder::for(Brand::class)
            ->allowedIncludes(BrandParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new BrandResource($brand)
        ], Response::HTTP_OK);
    }

    public function update(UpdateBrandRequest $request, Brand $brand): JsonResponse
    {
        try {
            $brand->update($request->validated());

            return response()->json([
                'message' => 'Brand updated successfully',
                'data' => new BrandResource($brand->load('status'))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update brand',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(Brand $brand): JsonResponse
    {
        try {
            $brand->delete();

            return response()->json([
                'message' => 'Brand deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete brand',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
