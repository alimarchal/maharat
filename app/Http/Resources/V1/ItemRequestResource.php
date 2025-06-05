<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ItemRequestResource extends JsonResource
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
            'quantity' => $this->quantity,
            'description' => $this->description,
            'photo' => $this->photo,
            'photo_url' => $this->photo_url,
            'user_id' => $this->user_id,
            'is_added' => $this->is_added,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
} 