<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RfqItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'rfq_id' => $this->rfq_id,
            'item_name' => $this->item_name,
            'description' => $this->description,
            'quantity' => $this->quantity,
            'brand' => $this->brand,
            'model' => $this->model,
            'specifications' => $this->specifications,
            'attachment' => $this->attachment,
            'expected_delivery_date' => $this->expected_delivery_date,
            'quoted_price' => $this->quoted_price,
            'negotiated_price' => $this->negotiated_price,

            // Relationships
            'category' => new ProductCategoryResource($this->whenLoaded('category')),
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'status' => new StatusResource($this->whenLoaded('status')),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
