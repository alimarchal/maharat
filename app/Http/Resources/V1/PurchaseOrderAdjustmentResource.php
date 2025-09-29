<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseOrderAdjustmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'purchase_order_id' => $this->purchase_order_id,
            'grn_id' => $this->grn_id,
            'user_id' => $this->user_id,
            'adjustment_type' => $this->adjustment_type,
            'adjustment_type_label' => $this->getAdjustmentTypeLabel(),
            'adjustment_reason' => $this->adjustment_reason,
            'adjustment_date' => $this->adjustment_date?->format('Y-m-d'),
            'original_amount' => $this->original_amount,
            'adjusted_amount' => $this->adjusted_amount,
            'adjustment_value' => $this->adjustment_value,
            'adjustment_percentage' => $this->getAdjustmentPercentage(),
            'affected_items' => $this->affected_items,
            'status' => $this->status,
            'status_label' => $this->getStatusLabel(),
            'approval_notes' => $this->approval_notes,
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at?->format('Y-m-d H:i:s'),
            'is_approved' => $this->isApproved(),
            'is_pending' => $this->isPending(),
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),

            // Include relations when loaded
            'purchase_order' => new PurchaseOrderResource($this->whenLoaded('purchaseOrder')),
            'grn' => new GrnResource($this->whenLoaded('grn')),
            'user' => new UserResource($this->whenLoaded('user')),
            'approver' => new UserResource($this->whenLoaded('approver')),
        ];
    }

    /**
     * Get human-readable adjustment type label
     */
    protected function getAdjustmentTypeLabel(): string
    {
        return match($this->adjustment_type) {
            'quantity_shortage' => 'Quantity Shortage',
            'quality_issue' => 'Quality Issue',
            'supplier_cancellation' => 'Supplier Cancellation',
            'other' => 'Other',
            default => 'Unknown Type'
        };
    }

    /**
     * Get human-readable status label
     */
    protected function getStatusLabel(): string
    {
        return match($this->status) {
            'pending' => 'Pending Approval',
            'approved' => 'Approved',
            'rejected' => 'Rejected',
            default => 'Unknown Status'
        };
    }

    /**
     * Calculate adjustment percentage
     */
    protected function getAdjustmentPercentage(): float
    {
        if ($this->original_amount == 0) {
            return 0;
        }
        return round(($this->adjustment_value / $this->original_amount) * 100, 2);
    }
}
