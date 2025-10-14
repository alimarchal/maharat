<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\GrnReceiveGood\StoreGrnReceiveGoodRequest;
use App\Http\Requests\V1\GrnReceiveGood\UpdateGrnReceiveGoodRequest;
use App\Http\Resources\V1\GrnReceiveGoodResource;
use App\Models\GrnReceiveGood;
use App\Models\QuotationItem;
use App\QueryParameters\GrnReceiveGoodParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class GrnReceiveGoodController extends Controller
{
    /**
     * Get unit price from quotation items based on quotation_id and quantity_quoted
     */
    private function getUnitPriceFromQuotationItems($quotationId, $quantityQuoted)
    {
        try {
            // Get quotation items for this quotation
            $quotationItems = QuotationItem::where('quotation_id', $quotationId)->get();
            
            if ($quotationItems->isEmpty()) {
                return null;
            }
            
            // If there's only one quotation item, return its unit price
            if ($quotationItems->count() === 1) {
                return $quotationItems->first()->unit_price;
            }
            
            // If there are multiple quotation items, try to match by quantity
            // This is a fallback approach - ideally we'd have rfq_item_id in grn_receive_goods
            foreach ($quotationItems as $quotationItem) {
                $rfqItem = $quotationItem->rfqItem;
                if ($rfqItem && $rfqItem->quantity == $quantityQuoted) {
                    return $quotationItem->unit_price;
                }
            }
            
            // If no exact match found, return the first item's unit price as fallback
            return $quotationItems->first()->unit_price;
            
        } catch (\Exception $e) {
            \Log::error('Error getting unit price from quotation items: ' . $e->getMessage());
            return null;
        }
    }
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $receiveGoods = QueryBuilder::for(GrnReceiveGood::class)
            ->allowedFilters(GrnReceiveGoodParameters::ALLOWED_FILTERS)
            ->allowedSorts(GrnReceiveGoodParameters::ALLOWED_SORTS)
            ->allowedIncludes(GrnReceiveGoodParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($receiveGoods->isEmpty()) {
            return response()->json([
                'message' => 'No received goods found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return GrnReceiveGoodResource::collection($receiveGoods);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreGrnReceiveGoodRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Set current user if not specified
            if (!isset($validated['user_id'])) {
                $validated['user_id'] = auth()->id();
            }

            // Populate UPC with unit price from quotation items
            if (isset($validated['quotation_id']) && isset($validated['quantity_quoted'])) {
                $unitPrice = $this->getUnitPriceFromQuotationItems(
                    $validated['quotation_id'], 
                    $validated['quantity_quoted']
                );
                
                if ($unitPrice !== null) {
                    $validated['upc'] = $unitPrice;
                }
            }

            $receiveGood = GrnReceiveGood::create($validated);

            DB::commit();

            return response()->json([
                'message' => 'Received good created successfully',
                'data' => new GrnReceiveGoodResource(
                    $receiveGood->load(['user', 'supplier', 'purchaseOrder', 'quotation', 'category'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create received good',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $receiveGood = QueryBuilder::for(GrnReceiveGood::class)
            ->allowedIncludes(GrnReceiveGoodParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new GrnReceiveGoodResource($receiveGood)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateGrnReceiveGoodRequest $request, GrnReceiveGood $grnReceiveGood): JsonResponse
    {
        try {
            DB::beginTransaction();

            $grnReceiveGood->update($request->validated());

            DB::commit();

            return response()->json([
                'message' => 'Received good updated successfully',
                'data' => new GrnReceiveGoodResource(
                    $grnReceiveGood->load(['user', 'supplier', 'purchaseOrder', 'quotation', 'category'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update received good',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(GrnReceiveGood $grnReceiveGood): JsonResponse
    {
        try {
            DB::beginTransaction();

            $grnReceiveGood->delete();

            DB::commit();

            return response()->json([
                'message' => 'Received good deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete received good',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
