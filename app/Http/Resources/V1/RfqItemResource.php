<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class RfqItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id,
            'rfq_id' => $this->rfq_id,
            'item_name' => $this->item_name,
            'description' => $this->description,
            'quantity' => number_format((float)$this->quantity, 1, '.', ''),
            'brand_id' => $this->brand_id,

            'model' => $this->model,
            'specifications' => $this->specifications,
            'unit_id' => $this->unit_id,
            'status_id' => $this->status_id,
            'attachment' => $this->when($this->attachment, function () {
                return [
                    'name' => $this->original_filename ?? basename($this->attachment),
                    'url' => $this->attachment,
                    'original_filename' => $this->original_filename
                ];
            }),
            'expected_delivery_date' => $this->expected_delivery_date,
            'quoted_price' => $this->quoted_price,
            'negotiated_price' => $this->negotiated_price,

            // Relationships
            'unit' => new UnitResource($this->whenLoaded('unit')),
            'status' => new StatusResource($this->whenLoaded('status')),
            'brand' => new BrandResource($this->whenLoaded('brand')),
            'product' => new ProductResource($this->whenLoaded('product')),
            'category' => new ProductCategoryResource($this->whenLoaded('category')),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
