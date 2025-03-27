<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetResource extends JsonResource
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
            'name' => $this->name,
            'asset_code' => $this->asset_code,
            'type' => $this->type,
            'status' => $this->status,
            'acquisition_cost' => $this->acquisition_cost,
            'current_value' => $this->current_value,
            'salvage_value' => $this->salvage_value,
            'acquisition_date' => $this->acquisition_date->format('Y-m-d'),
            'disposal_date' => $this->disposal_date ? $this->disposal_date->format('Y-m-d') : null,
            'useful_life_years' => $this->useful_life_years,
            'depreciation_method' => $this->depreciation_method,
            'description' => $this->description,
            'location' => $this->location,
            'department' => $this->department,
            'is_leased' => $this->is_leased,
            'lease_expiry_date' => $this->lease_expiry_date ? $this->lease_expiry_date->format('Y-m-d') : null,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
