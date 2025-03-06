<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChartOfAccountResource extends JsonResource
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
            'account_code' => $this->account_code,
            'account_name' => $this->account_name,
            'account_type' => $this->account_type,
            'parent_account_id' => $this->parent_account_id,
            'is_active' => $this->is_active,
            'description' => $this->description,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,

            // Include related resources when loaded
            'parent' => new ChartOfAccountResource($this->whenLoaded('parent')),
            'children' => ChartOfAccountResource::collection($this->whenLoaded('children')),
            'descendants' => ChartOfAccountResource::collection($this->whenLoaded('descendants')),
        ];
    }
}
