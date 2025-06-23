<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExternalDeliveryNoteResource extends JsonResource
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
            'grn_id' => $this->grn_id,
            'purchase_order_id' => $this->purchase_order_id,
            'delivery_note_number' => $this->delivery_note_number,
            'attachment_path' => $this->attachment_path,
            'attachment_name' => $this->attachment_name,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Include related resources when loaded
            'user' => new UserResource($this->whenLoaded('user')),
            'grn' => new GrnResource($this->whenLoaded('grn')),
            'purchase_order' => new PurchaseOrderResource($this->whenLoaded('purchaseOrder')),
        ];
    }
}
