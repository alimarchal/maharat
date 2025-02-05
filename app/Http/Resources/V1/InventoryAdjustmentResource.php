<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryAdjustmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'warehouse_id' => $this->warehouse_id,
            'product_id' => $this->product_id,
            'purchase_order_number' => $this->purchase_order_number,
            'quantity' => $this->quantity,
            'reason' => $this->reason,
            'description' => $this->description,
            'approved_by' => $this->approved_by,
            'warehouse' => new WarehouseResource($this->whenLoaded('warehouse')),
            'product' => new ProductResource($this->whenLoaded('product')),
            'reason_status' => new StatusResource($this->whenLoaded('reasonStatus')),
            'approved_by_user' => new UserResource($this->whenLoaded('approvedBy')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
