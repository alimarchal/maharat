<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\PurchaseOrder\StorePurchaseOrderRequest;
use App\Http\Requests\V1\PurchaseOrder\UpdatePurchaseOrderRequest;
use App\Http\Resources\V1\PurchaseOrderResource;
use App\Models\PurchaseOrder;
use App\QueryParameters\PurchaseOrderParameters;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Support\Facades\Storage;


class PurchaseOrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse|ResourceCollection
    {
        $purchaseOrders = QueryBuilder::for(PurchaseOrder::class)
            ->allowedFilters(PurchaseOrderParameters::ALLOWED_FILTERS)
            ->allowedSorts(PurchaseOrderParameters::ALLOWED_SORTS)
            ->allowedIncludes(PurchaseOrderParameters::ALLOWED_INCLUDES)
            ->paginate()
            ->appends(request()->query());

        if ($purchaseOrders->isEmpty()) {
            return response()->json([
                'message' => 'No purchase orders found',
                'data' => []
            ], Response::HTTP_OK);
        }

        return PurchaseOrderResource::collection($purchaseOrders);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePurchaseOrderRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Get validated data except the attachment
            $validatedData = $request->safe()->except(['attachment']);

            // Add the authenticated user's ID as creator
            $validatedData['user_id'] = auth()->id();

            $validatedData['purchase_order_no'] = $this->generatePurchaseOrderNumber();

            // Create purchase order
            $purchaseOrder = PurchaseOrder::create($validatedData);

            // Handle file upload if provided
            if ($request->hasFile('attachment')) {
                $path = $request->file('attachment')->store('purchase-orders','public');
                $purchaseOrder->attachment = $path;
                $purchaseOrder->save();
            }

            DB::commit();

            return response()->json([
                'message' => 'Purchase order created successfully',
                'data' => new PurchaseOrderResource(
                    $purchaseOrder->load(['quotation', 'supplier', 'user'])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create purchase order',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $purchaseOrder = QueryBuilder::for(PurchaseOrder::class)
            ->allowedIncludes(PurchaseOrderParameters::ALLOWED_INCLUDES)
            ->findOrFail($id);

        return response()->json([
            'data' => new PurchaseOrderResource($purchaseOrder)
        ], Response::HTTP_OK);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePurchaseOrderRequest $request, PurchaseOrder $purchaseOrder): JsonResponse
    {
        try {
            DB::beginTransaction();

            // Get validated data except the attachment
            $validatedData = $request->safe()->except(['attachment']);

            // Update purchase order
            $purchaseOrder->update($validatedData);

            // Handle file upload if provided
            if ($request->hasFile('attachment')) {
                // Delete old file if exists
                if ($purchaseOrder->attachment && Storage::exists($purchaseOrder->attachment)) {
                    Storage::delete($purchaseOrder->attachment);
                }

                // Store new file
                $path = $request->file('attachment')->store('purchase-orders');
                $purchaseOrder->attachment = $path;
                $purchaseOrder->save();
            }

            DB::commit();

            return response()->json([
                'message' => 'Purchase order updated successfully',
                'data' => new PurchaseOrderResource(
                    $purchaseOrder->load(['quotation', 'supplier'])
                )
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update purchase order',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PurchaseOrder $purchaseOrder): JsonResponse
    {
        try {
            DB::beginTransaction();

            $purchaseOrder->delete();

            DB::commit();

            return response()->json([
                'message' => 'Purchase order deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to delete purchase order',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Generate a unique purchase order number
     * Format: PO-YYYY-XXXXX (e.g., PO-2025-00001)
     */
    private function generatePurchaseOrderNumber(): string
    {
        $year = date('Y');
        $lastOrder = PurchaseOrder::whereYear('created_at', $year)
            ->orderBy('purchase_order_no', 'desc')
            ->first();

        if ($lastOrder) {
            // Extract the numeric part and increment
            $lastNumber = (int) substr($lastOrder->purchase_order_no, -5);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        // Format with leading zeros to maintain 5 digits
        return sprintf("PO-%s-%05d", $year, $newNumber);
    }
}
