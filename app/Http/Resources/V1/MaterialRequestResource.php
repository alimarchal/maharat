<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaterialRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'requester_id' => $this->requester_id,
            'warehouse_id' => $this->warehouse_id,
            'expected_delivery_date' => $this->expected_delivery_date?->toDateString(),
            'status_id' => $this->status_id,
            'requester' => new UserResource($this->whenLoaded('requester')),
            'warehouse' => new WarehouseResource($this->whenLoaded('warehouse')),
            'status' => new StatusResource($this->whenLoaded('status')),
            'items' => MaterialRequestItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
