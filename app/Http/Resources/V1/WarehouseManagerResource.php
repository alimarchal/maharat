<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WarehouseManagerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'warehouse_id' => $this->warehouse_id,
            'manager_id' => $this->manager_id,
            'warehouse' => new WarehouseResource($this->whenLoaded('warehouse')),
            'manager' => new UserResource($this->whenLoaded('manager')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
