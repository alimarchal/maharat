<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentOrderApprovalTransactionResource extends JsonResource
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
            'payment_order_id' => $this->payment_order_id,
            'requester_id' => $this->requester_id,
            'assigned_to' => $this->assigned_to,
            'referred_to' => $this->referred_to,
            'order' => $this->order,
            'description' => $this->description,
            'status' => $this->status,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,

            // Related resources
            'payment_order' => new PaymentOrderResource($this->whenLoaded('paymentOrder')),
            'requester' => new UserResource($this->whenLoaded('requester')),
            'assigned_user' => new UserResource($this->whenLoaded('assignedUser')),
            'referred_user' => new UserResource($this->whenLoaded('referredUser')),
            'created_by_user' => new UserResource($this->whenLoaded('createdByUser')),
            'updated_by_user' => new UserResource($this->whenLoaded('updatedByUser')),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
