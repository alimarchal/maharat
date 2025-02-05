<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Product\StoreProductRequest;
use App\Http\Requests\V1\Product\UpdateProductRequest;
use App\Http\Resources\V1\ProductResource;
use App\Models\Product;
use App\QueryParameters\ProductParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\QueryBuilder;

class ProductController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $products = QueryBuilder::for(Product::class)
            ->allowedFilters(ProductParameters::ALLOWED_FILTERS)
            ->allowedSorts(ProductParameters::ALLOWED_SORTS)
            ->allowedIncludes(ProductParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($products->isEmpty()) {
            return response()->json([
                'message' => 'No products found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return ProductResource::collection($products);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        try {
            $product = Product::create($request->validated());

            return response()->json([
                'message' => 'Product created successfully',
                'data' => new ProductResource($product->load(['category', 'unit']))
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create product',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $product = QueryBuilder::for(Product::class)
            ->allowedIncludes(ProductParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new ProductResource($product)
        ], Response::HTTP_OK);
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        try {
            $product->update($request->validated());

            return response()->json([
                'message' => 'Product updated successfully',
                'data' => new ProductResource($product->load(['category', 'unit']))
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update product',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(Product $product): JsonResponse
    {
        try {
            $product->delete();

            return response()->json([
                'message' => 'Product deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete product',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
