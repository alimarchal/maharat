<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GrnReceiveGoodResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'grn_id' => $this->grn_id,
            'supplier_id' => $this->supplier_id,
            'purchase_order_id' => $this->purchase_order_id,
            'quotation_id' => $this->quotation_id,
            'quantity_quoted' => $this->quantity_quoted,
            'quantity_delivered' => $this->quantity_delivered,
            'quantity_pending' => $this->quantity_pending,
            'delivery_percentage' => $this->getDeliveryPercentage(),
            'due_delivery_date' => $this->due_delivery_date?->format('Y-m-d'),
            'receiver_name' => $this->receiver_name,
            'upc' => $this->upc,
            'category_id' => $this->category_id,
            'delivery_date' => $this->delivery_date?->format('Y-m-d'),
            'delivery_status' => $this->delivery_status,
            'delivery_status_label' => $this->getDeliveryStatusLabel(),
            'is_complete_delivery' => $this->isCompleteDelivery(),
            'is_partial_delivery' => $this->isPartialDelivery(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Include relations when loaded
            'user' => new UserResource($this->whenLoaded('user')),
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
            'purchase_order' => new PurchaseOrderResource($this->whenLoaded('purchaseOrder')),
            'quotation' => new QuotationResource($this->whenLoaded('quotation')),
            'category' => new ProductCategoryResource($this->whenLoaded('category')),
        ];
    }

    /**
     * Calculate delivery percentage
     */
    protected function getDeliveryPercentage(): float
    {
        if ($this->quantity_quoted == 0) {
            return 0;
        }
        return round(($this->quantity_delivered / $this->quantity_quoted) * 100, 2);
    }

    /**
     * Get human-readable delivery status label
     */
    protected function getDeliveryStatusLabel(): string
    {
        return match($this->delivery_status) {
            'complete_delivery' => 'Complete Delivery',
            'later_delivery' => 'Expecting Later Delivery',
            'adjust_order' => 'Order Adjusted - No Further Delivery',
            default => 'Unknown Status'
        };
    }
}
