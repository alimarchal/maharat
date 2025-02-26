<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\MaterialRequestItem\StoreMaterialRequestItemRequest;
use App\Http\Requests\V1\MaterialRequestItem\UpdateMaterialRequestItemRequest;
use App\Http\Resources\V1\MaterialRequestItemResource;
use App\Models\MaterialRequestItem;
use App\QueryParameters\MaterialRequestItemParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\QueryBuilder;

class MaterialRequestItemController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        $items = QueryBuilder::for(MaterialRequestItem::class)
            ->allowedFilters(MaterialRequestItemParameters::ALLOWED_FILTERS)
            ->allowedSorts(MaterialRequestItemParameters::ALLOWED_SORTS)
            ->allowedIncludes(MaterialRequestItemParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($items->isEmpty()) {
            return response()->json([
                'message' => 'No material request items found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return MaterialRequestItemResource::collection($items);
    }

    public function store(StoreMaterialRequestItemRequest $request): JsonResponse
    {
        try {
            $item = MaterialRequestItem::create($request->validated());

            return response()->json([
                'message' => 'Material request item created successfully',
                'data' => new MaterialRequestItemResource(
                    $item->load(['product', 'unit', 'category', 'urgencyStatus'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create material request item',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $item = QueryBuilder::for(MaterialRequestItem::class)
            ->allowedIncludes(MaterialRequestItemParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new MaterialRequestItemResource($item)
        ], Response::HTTP_OK);
    }

    public function update(UpdateMaterialRequestItemRequest $request, MaterialRequestItem $materialRequestItem): JsonResponse
    {
        try {
            $materialRequestItem->update($request->validated());
            return response()->json([
                'message' => 'Material request item updated successfully',
                'data' => new MaterialRequestItemResource(
                    $materialRequestItem->load(['product', 'unit', 'category', 'urgencyStatus'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update material request item',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(MaterialRequestItem $materialRequestItem): JsonResponse
    {
        try {
            $materialRequestItem->delete();

            return response()->json([
                'message' => 'Material request item deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete material request item',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
