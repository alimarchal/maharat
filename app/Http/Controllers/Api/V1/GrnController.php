<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Grn\StoreGrnRequest;
use App\Http\Requests\V1\Grn\UpdateGrnRequest;
use App\Http\Resources\V1\GrnResource;
use App\Models\Grn;
use App\Models\PurchaseOrder;
use App\QueryParameters\GrnParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;

class GrnController extends Controller
{
    /**
     * Generate a unique GRN number
     * Format: GRN-YYYY-XXXXX (e.g., GRN-2025-00001)
     */
    private function generateGrnNumber(): string
    {
        $maxAttempts = 10;
        $attempt = 0;
        
        do {
            $attempt++;
            $year = date('Y');
            $lastGrn = Grn::whereYear('created_at', $year)
                ->orderBy('grn_number', 'desc')
                ->first();

            if ($lastGrn) {
                // Extract the numeric part (last 5 digits) and increment
                $lastNumber = (int) substr($lastGrn->grn_number, -5);
                $newNumber = $lastNumber + 1;
            } else {
                $newNumber = 1;
            }

            // Format with leading zeros to maintain 5 digits
            $grnNumber = sprintf("GRN-%s-%05d", $year, $newNumber);
            
            // Check if this number already exists (race condition protection)
            $exists = Grn::where('grn_number', $grnNumber)->exists();
            
            if (!$exists) {
                return $grnNumber;
            }
            
            // If we've tried too many times, use a timestamp-based approach
            if ($attempt >= $maxAttempts) {
                $timestamp = time();
                return sprintf("GRN-%s-%05d", $year, $timestamp % 100000);
            }
            
        } while (true);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $grns = QueryBuilder::for(Grn::class)
            ->allowedFilters(GrnParameters::ALLOWED_FILTERS)
            ->allowedSorts(GrnParameters::ALLOWED_SORTS)
            ->allowedIncludes(GrnParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($grns->isEmpty()) {
            return response()->json([
                'message' => 'No GRNs found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return GrnResource::collection($grns);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreGrnRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $validated = $request->validated();

            // Auto-generate GRN number if not provided
            if (!isset($validated['grn_number'])) {
                $validated['grn_number'] = $this->generateGrnNumber();
            }

            // Set current user as creator if not specified
            if (!isset($validated['user_id'])) {
                $validated['user_id'] = auth()->id();
            }

            // Set default delivery status if not provided
            if (!isset($validated['delivery_status'])) {
                $validated['delivery_status'] = 'complete_delivery';
            }

            $grn = Grn::create($validated);

            // Update purchase order delivery status if purchase_order_id is provided
            if (isset($validated['purchase_order_id'])) {
                $purchaseOrder = PurchaseOrder::find($validated['purchase_order_id']);
                if ($purchaseOrder) {
                    $purchaseOrder->updateDeliveryStatus();
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'GRN created successfully',
                'data' => new GrnResource(
                    $grn->load(['user', 'quotation', 'purchaseOrder', 'receiveGoods'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create GRN',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $grn = QueryBuilder::for(Grn::class)
            ->allowedIncludes(GrnParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new GrnResource($grn)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateGrnRequest $request, Grn $grn): JsonResponse
    {
        try {
            DB::beginTransaction();

            $oldPurchaseOrderId = $grn->purchase_order_id;
            $grn->update($request->validated());

            // Update purchase order delivery status for both old and new PO (if changed)
            if ($oldPurchaseOrderId) {
                $oldPurchaseOrder = PurchaseOrder::find($oldPurchaseOrderId);
                if ($oldPurchaseOrder) {
                    $oldPurchaseOrder->updateDeliveryStatus();
                }
            }

            if ($grn->purchase_order_id && $grn->purchase_order_id !== $oldPurchaseOrderId) {
                $newPurchaseOrder = PurchaseOrder::find($grn->purchase_order_id);
                if ($newPurchaseOrder) {
                    $newPurchaseOrder->updateDeliveryStatus();
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'GRN updated successfully',
                'data' => new GrnResource(
                    $grn->load(['user', 'quotation', 'purchaseOrder', 'receiveGoods'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update GRN',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Grn $grn): JsonResponse
    {
        try {
            DB::beginTransaction();

            $purchaseOrderId = $grn->purchase_order_id;
            $grn->delete();

            // Update purchase order delivery status after deletion
            if ($purchaseOrderId) {
                $purchaseOrder = PurchaseOrder::find($purchaseOrderId);
                if ($purchaseOrder) {
                    $purchaseOrder->updateDeliveryStatus();
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'GRN deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete GRN',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Get delivery status options
     */
    public function getDeliveryStatusOptions(): JsonResponse
    {
        return response()->json([
            'data' => [
                'complete_delivery' => 'Complete Delivery',
                'later_delivery' => 'Expecting Later Delivery',
                'adjust_order' => 'Adjust Order (No Further Delivery)'
            ]
        ]);
    }

    /**
     * Get GRNs by delivery status
     */
    public function getByDeliveryStatus(string $status): JsonResponse
    {
        $validStatuses = ['complete_delivery', 'later_delivery', 'adjust_order'];
        
        if (!in_array($status, $validStatuses)) {
            return response()->json([
                'message' => 'Invalid delivery status',
                'valid_statuses' => $validStatuses
            ], Response::HTTP_BAD_REQUEST);
        }

        $grns = QueryBuilder::for(Grn::class)
            ->where('delivery_status', $status)
            ->allowedIncludes(GrnParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        return GrnResource::collection($grns);
    }
}
