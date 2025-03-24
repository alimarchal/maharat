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
            'due_delivery_date' => $this->due_delivery_date?->format('Y-m-d'),
            'receiver_name' => $this->receiver_name,
            'upc' => $this->upc,
            'category_id' => $this->category_id,
            'quantity_delivered' => $this->quantity_delivered,
            'delivery_date' => $this->delivery_date?->format('Y-m-d'),
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
}
