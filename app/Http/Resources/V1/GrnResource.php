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
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Include relations when loaded
            'user' => new UserResource($this->whenLoaded('user')),
            'quotation' => new QuotationResource($this->whenLoaded('quotation')),
            'purchase_order' => new PurchaseOrderResource($this->whenLoaded('purchaseOrder')),
            'receive_goods' => GrnReceiveGoodResource::collection($this->whenLoaded('receiveGoods')),
            'external_delivery_notes' => ExternalDeliveryNoteResource::collection($this->whenLoaded('externalDeliveryNote')),
        ];
    }
}
