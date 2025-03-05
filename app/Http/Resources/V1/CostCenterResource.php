<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CostCenterResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'department_id' => $this->department_id,
            'code' => $this->code,
            'name' => $this->name,
            'cost_center_type' => $this->cost_center_type,
            'description' => $this->description,
            'status' => $this->status,
            'effective_start_date' => $this->effective_start_date?->toDateString(),
            'effective_end_date' => $this->effective_end_date?->toDateString(),
            'manager_id' => $this->manager_id,
            'budget_owner_id' => $this->budget_owner_id,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,

            // Include related resources when loaded
            'parent' => new CostCenterResource($this->whenLoaded('parent')),
            'children' => CostCenterResource::collection($this->whenLoaded('children')),
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'manager' => new UserResource($this->whenLoaded('manager')),
            'budget_owner' => new UserResource($this->whenLoaded('budgetOwner')),
            'created_by_user' => new UserResource($this->whenLoaded('createdBy')),
            'updated_by_user' => new UserResource($this->whenLoaded('updatedBy')),
        ];
    }
}
