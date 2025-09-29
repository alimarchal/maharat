<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GrnResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'grn_number' => $this->grn_number,
            'quotation_id' => $this->quotation_id,
            'purchase_order_id' => $this->purchase_order_id,
            'quantity' => $this->quantity,
            'delivery_date' => $this->delivery_date?->format('Y-m-d'),
            'delivery_status' => $this->delivery_status,
            'delivery_status_label' => $this->getDeliveryStatusLabel(),
            'adjustment_notes' => $this->adjustment_notes,
            'is_complete_delivery' => $this->isCompleteDelivery(),
            'is_later_delivery' => $this->isLaterDelivery(),
            'is_adjusted_order' => $this->isAdjustedOrder(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Include relations when loaded
            'user' => new UserResource($this->whenLoaded('user')),
            'quotation' => new QuotationResource($this->whenLoaded('quotation')),
            'purchase_order' => new PurchaseOrderResource($this->whenLoaded('purchaseOrder')),
            'receive_goods' => GrnReceiveGoodResource::collection($this->whenLoaded('receiveGoods')),
            'external_delivery_notes' => ExternalDeliveryNoteResource::collection($this->whenLoaded('externalDeliveryNote')),
            'adjustments' => PurchaseOrderAdjustmentResource::collection($this->whenLoaded('adjustments')),
        ];
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
