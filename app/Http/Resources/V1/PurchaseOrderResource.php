<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseOrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'purchase_order_no' => $this->purchase_order_no,
            'quotation_id' => $this->quotation_id,
            'supplier_id' => $this->supplier_id,
            'user_id' => $this->user_id,
            'purchase_order_date' => $this->purchase_order_date->toDateString(),
            'amount' => $this->amount,
            'attachment' => $this->attachment,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

//            // Include related resources when loaded
            'quotation' => new QuotationResource($this->whenLoaded('quotation')),
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
            'created_by' => new UserResource($this->whenLoaded('user')),
        ];
    }
}
