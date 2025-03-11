<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartmentResource extends JsonResource
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
            'parent_id' => $this->parent_id,
            'name' => $this->name,
            'code' => $this->code,
            'is_active' => $this->is_active,
            'company_id' => $this->company_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->when($request->user()?->can('viewDeleted', Department::class), $this->deleted_at),
            'users' => UserResource::collection($this->whenLoaded('users')),

            // Include related resources when loaded
            'parent' => new DepartmentResource($this->whenLoaded('parent')),
            'children' => DepartmentResource::collection($this->whenLoaded('children')),
            'company' => new CompanyResource($this->whenLoaded('company')),
        ];
    }
}
