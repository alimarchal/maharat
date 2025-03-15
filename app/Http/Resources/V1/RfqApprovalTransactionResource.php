<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RfqApprovalTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'rfq_id' => $this->rfq_id,
            'requester_id' => $this->requester_id,
            'assigned_to' => $this->assigned_to,
            'referred_to' => $this->referred_to,
            'order' => $this->order,
            'description' => $this->description,
            'status' => $this->status,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,

            // Include related resources when loaded
            'rfq' => new RfqResource($this->whenLoaded('rfq')),
            'requester' => new UserResource($this->whenLoaded('requester')),
            'assigned_to_user' => new UserResource($this->whenLoaded('assignedTo')),
            'referred_to_user' => new UserResource($this->whenLoaded('referredTo')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'updater' => new UserResource($this->whenLoaded('updater')),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
