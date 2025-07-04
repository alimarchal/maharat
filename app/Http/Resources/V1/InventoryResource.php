<?php

namespace App\Http\Resources\V1;

use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [

            'id' => $this->id,
            'warehouse_id' => $this->warehouse_id,
            'product_id' => $this->product_id,
            'user_id' => $this->user_id,
            'category' => $this->product?->category,
            'brand' => Brand::find($this->product?->category_id),
            'quantity' => $this->quantity,
            'reorder_level' => $this->reorder_level,
            'description' => $this->description,
            'excel_document' => $this->excel_document,
            'pdf_document' => $this->pdf_document,
            'warehouse' => new WarehouseResource($this->whenLoaded('warehouse')),
            'product' => new ProductResource($this->whenLoaded('product')),
            'user' => new UserResource($this->whenLoaded('user')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
