<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\ProductCategory\StoreProductCategoryRequest;
use App\Http\Requests\V1\ProductCategory\UpdateProductCategoryRequest;
use App\Http\Resources\V1\ProductCategoryResource;
use App\Models\ProductCategory;
use App\QueryParameters\ProductCategoryParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\QueryBuilder;

class ProductCategoryController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        \Log::info('ProductCategory index request params:', request()->all());
        
        $query = QueryBuilder::for(ProductCategory::class)
            ->allowedFilters(ProductCategoryParameters::ALLOWED_FILTERS)
            ->allowedSorts(ProductCategoryParameters::ALLOWED_SORTS);

        // If per_page is specified, return all records
        if (request()->has('per_page')) {
            $categories = $query->get();
            \Log::info('Returning all categories:', ['count' => $categories->count()]);
            return response()->json([
                'data' => ProductCategoryResource::collection($categories)
            ]);
        }

        // Otherwise, paginate the results
        $categories = $query->paginate()->appends(request()->query());

        if ($categories->isEmpty()) {
            return response()->json([
                'message' => 'No product categories found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return ProductCategoryResource::collection($categories);
    }

    public function store(StoreProductCategoryRequest $request): JsonResponse
    {
        try {
            $category = ProductCategory::create($request->validated());

            return response()->json([
                'message' => 'Product category created successfully',
                'data' => new ProductCategoryResource($category)
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create product category',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $category = QueryBuilder::for(ProductCategory::class)
            ->allowedIncludes(ProductCategoryParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new ProductCategoryResource($category)
        ], Response::HTTP_OK);
    }

    public function update(UpdateProductCategoryRequest $request, ProductCategory $productCategory): JsonResponse
    {
        try {
            $productCategory->update($request->validated());

            return response()->json([
                'message' => 'Product category updated successfully',
                'data' => new ProductCategoryResource($productCategory)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update product category',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(ProductCategory $productCategory): JsonResponse
    {
        try {
            // Delete all products associated with this category
            $productCategory->products()->delete(); 

            // Now delete the category
            $productCategory->delete();

            return response()->json([
                'message' => 'Product category deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete product category',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

}
