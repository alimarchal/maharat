<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentOrderLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'payment_order_id' => $this->payment_order_id,
            'description' => $this->description,
            'action' => $this->action,
            'priority' => $this->priority,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Related resources
            'payment_order' => new PaymentOrderResource($this->whenLoaded('paymentOrder'))
        ];
    }
}
