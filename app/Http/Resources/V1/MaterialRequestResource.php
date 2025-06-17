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
            'department_id' => $this->department_id,
            'cost_center_id' => $this->cost_center_id,
            'sub_cost_center_id' => $this->sub_cost_center_id,
            'expected_delivery_date' => $this->expected_delivery_date?->toDateString(),
            'status_id' => $this->status_id,
            'rejection_reason' => $this->rejection_reason,
            'requester' => new UserResource($this->whenLoaded('requester')),
            'warehouse' => new WarehouseResource($this->whenLoaded('warehouse')),
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'costCenter' => new CostCenterResource($this->whenLoaded('costCenter')),
            'subCostCenter' => new CostCenterResource($this->whenLoaded('subCostCenter')),
            'status' => new StatusResource($this->whenLoaded('status')),
            'items' => MaterialRequestItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
