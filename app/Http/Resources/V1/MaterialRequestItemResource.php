<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaterialRequestItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'material_request_id' => $this->material_request_id,
            'product_id' => $this->product_id,
            'unit_id' => $this->unit_id,
            'category_id' => $this->category_id,
            'quantity' => $this->quantity,
            'urgency' => $this->urgency,
            'description' => $this->description,
            'photo' => $this->photo,
            'product' => new ProductResource($this->whenLoaded('product')),
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'category' => new ProductCategoryResource($this->whenLoaded('category')),
            'urgency_status' => new StatusResource($this->whenLoaded('urgencyStatus')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
