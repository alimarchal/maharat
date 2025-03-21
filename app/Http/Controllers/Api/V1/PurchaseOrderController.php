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
use Illuminate\Http\Request;

class PurchaseOrderController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            // Check if quotation_id is provided to filter results
            $quotationId = $request->input('quotation_id');
            
            $query = PurchaseOrder::query();
            
            // Apply quotation_id filter if provided
            if ($quotationId) {
                $query->where('quotation_id', $quotationId);
            }
            
            $purchaseOrders = $query->get();

            return response()->json([
                'data' => PurchaseOrderResource::collection($purchaseOrders)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            \Log::error('Error fetching purchase orders: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
            return response()->json([
                'message' => 'Error fetching purchase orders',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    public function getNextPurchaseOrderNumber(): JsonResponse
    {
        try {
            $nextNumber = $this->generatePurchaseOrderNumber();
            \Log::info('Generated next purchase order number: ' . $nextNumber);
            return response()->json([
                'success' => true,
                'next_number' => $nextNumber
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to generate next purchase order number: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate next purchase order number: ' . $e->getMessage()
            ], 500);
        }
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

            // Generate unique purchase order number
            $validatedData['purchase_order_no'] = $this->generatePurchaseOrderNumber();

            // Create purchase order
            $purchaseOrder = PurchaseOrder::create($validatedData);

            // Handle file upload if provided
            if ($request->hasFile('attachment')) {
                $path = $request->file('attachment')->store('purchase-orders','public');
                $purchaseOrder->attachment = $path;
                $purchaseOrder->original_name = $request->file('attachment')->getClientOriginalName();
                $purchaseOrder->save();
            }

            DB::commit();

            return response()->json([
                'message' => 'Purchase order created successfully',
                'data' => new PurchaseOrderResource(
                    $purchaseOrder->load([
                        'quotation',
                        'supplier',
                        'user',
                        'department',
                        'costCenter',
                        'subCostCenter',
                        'warehouse',
                        ])
                )
            ], Response::HTTP_CREATED);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to create purchase order: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
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
        try {
            $purchaseOrder = PurchaseOrder::with([
                'quotation',
                'supplier',
                'user',
                'department',
                'costCenter',
                'subCostCenter',
                'warehouse',
            ])->findOrFail($id);

            return response()->json([
                'data' => new PurchaseOrderResource($purchaseOrder)
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retrieve purchase order',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
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
                if ($purchaseOrder->attachment && Storage::disk('public')->exists($purchaseOrder->attachment)) {
                    Storage::disk('public')->delete($purchaseOrder->attachment);
                }

                // Store new file
                $path = $request->file('attachment')->store('purchase-orders', 'public');
                $purchaseOrder->attachment = $path;
                $purchaseOrder->original_name = $request->file('attachment')->getClientOriginalName();
                $purchaseOrder->save();
            }

            DB::commit();

            return response()->json([
                'message' => 'Purchase order updated successfully',
                'data' => new PurchaseOrderResource(
                    $purchaseOrder->load([
                        'quotation',
                        'supplier',
                        'department',
                        'costCenter',
                        'subCostCenter',
                        'warehouse',
                    ])
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
     * Format: PO-YYYY-XXXX (e.g., PO-2025-0001)
     */
    private function generatePurchaseOrderNumber(): string
    {
        $year = date('Y');

        // Find the last purchase order for the current year
        $lastPurchaseOrder = PurchaseOrder::whereYear('created_at', $year)
            ->orderBy('purchase_order_no', 'desc')
            ->first();

        $newNumber = 1; // Default to 1 if no purchase order exists

        if ($lastPurchaseOrder && preg_match('/PO-\d{4}-(\d+)/', $lastPurchaseOrder->purchase_order_no, $matches)) {
            $newNumber = (int)$matches[1] + 1;
        }

        return sprintf("PO-%s-%04d", $year, $newNumber);
    }

}