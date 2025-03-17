<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IssueMaterialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'material_request_id' => $this->material_request_id,
            'cost_center_id' => $this->cost_center_id,
            'sub_cost_center_id' => $this->sub_cost_center_id,
            'department_id' => $this->department_id,
            'priority' => $this->priority,
            'status' => $this->status,
            'description' => $this->description,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Include related resources when loaded
            'material_request' => new MaterialRequestResource($this->whenLoaded('materialRequest')),
            'cost_center' => new CostCenterResource($this->whenLoaded('costCenter')),
            'sub_cost_center' => new CostCenterResource($this->whenLoaded('subCostCenter')),
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'updater' => new UserResource($this->whenLoaded('updater')),
        ];
    }
}
