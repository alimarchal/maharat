<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaterialRequestTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'material_request_id' => $this->material_request_id,
            'order' => $this->order,
            'requester_id' => $this->requester_id,
            'assigned_to' => $this->assigned_to,
            'referred_to' => $this->referred_to,
            'description' => $this->description,
            'status' => $this->status,
            'material_request' => new MaterialRequestResource($this->whenLoaded('materialRequest')),
            'requester' => new UserResource($this->whenLoaded('requester')),
            'assigned_user' => new UserResource($this->whenLoaded('assignedUser')),
            'referred_user' => new UserResource($this->whenLoaded('referredUser')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
