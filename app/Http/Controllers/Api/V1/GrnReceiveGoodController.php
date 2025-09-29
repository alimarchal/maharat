<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\GrnReceiveGood\StoreGrnReceiveGoodRequest;
use App\Http\Requests\V1\GrnReceiveGood\UpdateGrnReceiveGoodRequest;
use App\Http\Resources\V1\GrnReceiveGoodResource;
use App\Models\GrnReceiveGood;
use App\Models\PurchaseOrder;
use App\QueryParameters\GrnReceiveGoodParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class GrnReceiveGoodController extends Controller
{
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

            // Set default delivery status if not provided
            if (!isset($validated['delivery_status'])) {
                $validated['delivery_status'] = 'complete_delivery';
            }

            // Calculate pending quantity if not provided
            if (!isset($validated['quantity_pending']) && isset($validated['quantity_quoted'], $validated['quantity_delivered'])) {
                $validated['quantity_pending'] = $validated['quantity_quoted'] - $validated['quantity_delivered'];
            }

            $receiveGood = GrnReceiveGood::create($validated);

            // Auto-calculate pending quantity using model method
            $receiveGood->calculatePendingQuantity()->save();

            // Update purchase order delivery status if purchase_order_id is provided
            if (isset($validated['purchase_order_id'])) {
                $purchaseOrder = PurchaseOrder::find($validated['purchase_order_id']);
                if ($purchaseOrder) {
                    $purchaseOrder->updateDeliveryStatus();
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Received good created successfully',
                'data' => new GrnReceiveGoodResource(
                    $receiveGood->load(['user', 'supplier', 'purchaseOrder', 'quotation', 'category'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('GrnReceiveGood creation failed: ' . $e->getMessage());
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

            $oldPurchaseOrderId = $grnReceiveGood->purchase_order_id;
            $grnReceiveGood->update($request->validated());

            // Auto-calculate pending quantity
            $grnReceiveGood->calculatePendingQuantity()->save();

            // Update purchase order delivery status for both old and new PO (if changed)
            if ($oldPurchaseOrderId) {
                $oldPurchaseOrder = PurchaseOrder::find($oldPurchaseOrderId);
                if ($oldPurchaseOrder) {
                    $oldPurchaseOrder->updateDeliveryStatus();
                }
            }

            if ($grnReceiveGood->purchase_order_id && $grnReceiveGood->purchase_order_id !== $oldPurchaseOrderId) {
                $newPurchaseOrder = PurchaseOrder::find($grnReceiveGood->purchase_order_id);
                if ($newPurchaseOrder) {
                    $newPurchaseOrder->updateDeliveryStatus();
                }
            }

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

            $purchaseOrderId = $grnReceiveGood->purchase_order_id;
            $grnReceiveGood->delete();

            // Update purchase order delivery status after deletion
            if ($purchaseOrderId) {
                $purchaseOrder = PurchaseOrder::find($purchaseOrderId);
                if ($purchaseOrder) {
                    $purchaseOrder->updateDeliveryStatus();
                }
            }

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
