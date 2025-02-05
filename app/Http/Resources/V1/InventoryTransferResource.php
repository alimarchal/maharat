<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryTransferResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'from_warehouse_id' => $this->from_warehouse_id,
            'to_warehouse_id' => $this->to_warehouse_id,
            'product_id' => $this->product_id,
            'quantity' => $this->quantity,
            'reason' => $this->reason,
            'tracking_number' => $this->tracking_number,
            'transfer_date' => $this->transfer_date?->toDateString(),
            'from_warehouse' => new WarehouseResource($this->whenLoaded('fromWarehouse')),
            'to_warehouse' => new WarehouseResource($this->whenLoaded('toWarehouse')),
            'product' => new ProductResource($this->whenLoaded('product')),
            'reason_status' => new StatusResource($this->whenLoaded('reasonStatus')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
