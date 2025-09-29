<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrderAdjustment;
use App\Models\PurchaseOrder;
use App\Http\Resources\V1\PurchaseOrderAdjustmentResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PurchaseOrderAdjustmentController extends Controller
{
    /**
     * Display a listing of purchase order adjustments.
     */
    public function index(): JsonResponse
    {
        $adjustments = PurchaseOrderAdjustment::with([
            'purchaseOrder', 
            'grn', 
            'user', 
            'approver'
        ])
        ->orderBy('created_at', 'desc')
        ->paginate();

        return response()->json([
            'data' => PurchaseOrderAdjustmentResource::collection($adjustments)
        ], Response::HTTP_OK);
    }

    /**
     * Store a newly created adjustment.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'purchase_order_id' => 'required|exists:purchase_orders,id',
            'grn_id' => 'nullable|exists:grns,id',
            'adjustment_type' => [
                'required',
                Rule::in(['quantity_shortage', 'quality_issue', 'supplier_cancellation', 'other'])
            ],
            'adjustment_reason' => 'required|string|max:1000',
            'adjustment_date' => 'required|date',
            'original_amount' => 'nullable|numeric|min:0', // Make optional
            'adjusted_amount' => 'nullable|numeric|min:0', // Make optional
            'affected_items' => 'nullable|array',
            'affected_items.*.item_id' => 'required_with:affected_items|integer',
            'affected_items.*.ordered_quantity' => 'required_with:affected_items|numeric|min:0',
            'affected_items.*.delivered_quantity' => 'required_with:affected_items|numeric|min:0',
            'affected_items.*.adjusted_quantity' => 'required_with:affected_items|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();

            // Get purchase order
            $purchaseOrder = PurchaseOrder::findOrFail($validated['purchase_order_id']);
            
            // Auto-calculate amounts if not provided
            if (!isset($validated['original_amount'])) {
                $validated['original_amount'] = $purchaseOrder->amount;
            }
            
            if (!isset($validated['adjusted_amount'])) {
                // Calculate adjusted amount based on affected items
                $adjustedAmount = $validated['original_amount'];
                
                if (isset($validated['affected_items']) && is_array($validated['affected_items'])) {
                    $totalAdjustment = 0;
                    foreach ($validated['affected_items'] as $item) {
                        $adjustedQty = $item['adjusted_quantity'] ?? 0;
                        $unitPrice = $item['estimated_unit_price'] ?? 0;
                        $totalAdjustment += $adjustedQty * $unitPrice;
                    }
                    $adjustedAmount = $validated['original_amount'] - $totalAdjustment;
                }
                
                $validated['adjusted_amount'] = max(0, $adjustedAmount);
            }

            // Calculate adjustment value
            $adjustmentValue = $validated['adjusted_amount'] - $validated['original_amount'];

            $adjustment = PurchaseOrderAdjustment::create([
                ...$validated,
                'user_id' => auth()->id(),
                'adjustment_value' => $adjustmentValue,
                'status' => 'pending'
            ]);

            // For quantity shortages, auto-approve and update purchase order
            if ($validated['adjustment_type'] === 'quantity_shortage') {
                $adjustment->update([
                    'status' => 'approved',
                    'approved_by' => auth()->id(),
                    'approved_at' => now(),
                    'approval_notes' => 'Auto-approved quantity shortage adjustment'
                ]);
                
                // Update purchase order amounts
                $purchaseOrder->update([
                    'amount' => $validated['adjusted_amount'],
                    'pending_amount' => max(0, $validated['adjusted_amount'] - ($purchaseOrder->delivered_amount ?? 0))
                ]);
                
                // Update delivery status if method exists
                if (method_exists($purchaseOrder, 'updateDeliveryStatus')) {
                    $purchaseOrder->updateDeliveryStatus();
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Purchase order adjustment created successfully',
                'data' => new PurchaseOrderAdjustmentResource(
                    $adjustment->load(['purchaseOrder', 'grn', 'user', 'approver'])
                )
            ], Response::HTTP_CREATED);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Purchase order adjustment creation failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to create purchase order adjustment',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified adjustment.
     */
    public function show($id): JsonResponse
    {
        $adjustment = PurchaseOrderAdjustment::with(['purchaseOrder', 'grn', 'user', 'approver'])
            ->findOrFail($id);
            
        return response()->json([
            'data' => new PurchaseOrderAdjustmentResource($adjustment)
        ], Response::HTTP_OK);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id): JsonResponse
    {
        try {
            $adjustment = PurchaseOrderAdjustment::findOrFail($id);
            $adjustment->delete();

            return response()->json([
                'message' => 'Purchase order adjustment deleted successfully'
            ], Response::HTTP_OK);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete adjustment',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Approve an adjustment.
     */
    public function approve($id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'approval_notes' => 'nullable|string|max:1000'
        ]);

        try {
            DB::beginTransaction();

            $adjustment = PurchaseOrderAdjustment::findOrFail($id);

            if ($adjustment->status === 'approved') {
                return response()->json([
                    'message' => 'Adjustment is already approved'
                ], Response::HTTP_BAD_REQUEST);
            }

            $adjustment->update([
                'status' => 'approved',
                'approved_by' => auth()->id(),
                'approved_at' => now(),
                'approval_notes' => $validated['approval_notes'] ?? null
            ]);

            // Update purchase order based on adjustment
            $purchaseOrder = $adjustment->purchaseOrder;
            if ($purchaseOrder) {
                $purchaseOrder->update([
                    'amount' => $adjustment->adjusted_amount,
                    'pending_amount' => max(0, $adjustment->adjusted_amount - ($purchaseOrder->delivered_amount ?? 0))
                ]);
                
                if (method_exists($purchaseOrder, 'updateDeliveryStatus')) {
                    $purchaseOrder->updateDeliveryStatus();
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Purchase order adjustment approved successfully',
                'data' => new PurchaseOrderAdjustmentResource(
                    $adjustment->load(['purchaseOrder', 'grn', 'user', 'approver'])
                )
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to approve adjustment',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Reject an adjustment.
     */
    public function reject($id, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'approval_notes' => 'required|string|max:1000'
        ]);

        $adjustment = PurchaseOrderAdjustment::findOrFail($id);
        
        $adjustment->update([
            'status' => 'rejected',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
            'approval_notes' => $validated['approval_notes']
        ]);

        return response()->json([
            'message' => 'Purchase order adjustment rejected',
            'data' => new PurchaseOrderAdjustmentResource(
                $adjustment->load(['purchaseOrder', 'grn', 'user', 'approver'])
            )
        ], Response::HTTP_OK);
    }

    /**
     * Get adjustments for a specific purchase order.
     */
    public function getByPurchaseOrder(int $purchaseOrderId): JsonResponse
    {
        $adjustments = PurchaseOrderAdjustment::where('purchase_order_id', $purchaseOrderId)
            ->with(['grn', 'user', 'approver'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => PurchaseOrderAdjustmentResource::collection($adjustments)
        ], Response::HTTP_OK);
    }
}
