<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\RfqItem\StoreRfqItemRequest;
use App\Http\Requests\V1\RfqItem\UpdateRfqItemRequest;
use App\Http\Resources\V1\RfqItemResource;
use App\Models\RfqItem;
use App\QueryParameters\RfqItemParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Spatie\QueryBuilder\QueryBuilder;

class RfqItemController extends Controller
{
    public function index(): JsonResponse|ResourceCollection
    {
        try {
            $rfqItems = RfqItem::with(['unit:id,name', 'brand:id,name'])->get();
            
            return response()->json([
                'success' => true,
                'data' => $rfqItems
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch RFQ items'
            ], 500);
        }
    }

    public function store(StoreRfqItemRequest $request): JsonResponse
    {
        try {
            $item = RfqItem::create($request->validated());

            return response()->json([
                'message' => 'RFQ item created successfully',
                'data' => new RfqItemResource(
                    $item->load(['category', 'unit', 'status'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create RFQ item',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function show(string $id): JsonResponse
    {
        $item = QueryBuilder::for(RfqItem::class)
            ->allowedIncludes(RfqItemParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new RfqItemResource($item)
        ], Response::HTTP_OK);
    }

    public function update(UpdateRfqItemRequest $request, RfqItem $rfqItem): JsonResponse
    {
        try {
            $rfqItem->update($request->validated());

            return response()->json([
                'message' => 'RFQ item updated successfully',
                'data' => new RfqItemResource(
                    $rfqItem->load(['category', 'unit', 'status'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update RFQ item',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function destroy(RfqItem $rfqItem): JsonResponse
    {
        try {
            $rfqItem->delete();

            return response()->json([
                'message' => 'RFQ item deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete RFQ item',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
