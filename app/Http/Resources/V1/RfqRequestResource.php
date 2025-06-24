<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RfqRequestResource extends JsonResource
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
            'user_id' => $this->user_id,
            'name' => $this->name,
            'description' => $this->description,
            'quantity' => $this->quantity,
            'category_id' => $this->category_id,
            'unit_id' => $this->unit_id,
            'warehouse_id' => $this->warehouse_id,
            'department_id' => $this->department_id,
            'cost_center_id' => $this->cost_center_id,
            'sub_cost_center_id' => $this->sub_cost_center_id,
            'photo' => $this->photo,
            'status' => $this->status,
            'approved_by' => $this->approved_by,
            'rfq_id' => $this->rfq_id,
            'approved_at' => $this->approved_at,
            'rejection_reason' => $this->rejection_reason,
            'is_requested' => $this->is_requested,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'user' => $this->whenLoaded('user'),
            'category' => $this->whenLoaded('category'),
            'unit' => $this->whenLoaded('unit'),
            'warehouse' => $this->whenLoaded('warehouse'),
            'department' => $this->whenLoaded('department'),
            'costCenter' => $this->whenLoaded('costCenter'),
            'subCostCenter' => $this->whenLoaded('subCostCenter'),
            'approvedBy' => $this->whenLoaded('approvedBy'),
            'rfq' => $this->whenLoaded('rfq'),
        ];
    }
}
