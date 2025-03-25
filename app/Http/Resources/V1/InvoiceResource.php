<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'representative' => $this->representative,
            'representative_email' => $this->representative_email,
            'client_id' => $this->client_id,
            'status' => $this->status,
            'payment_method' => $this->payment_method,
            'issue_date' => $this->issue_date?->toDateString(),
            'due_date' => $this->due_date?->toDateString(),
            'discounted_days' => $this->discounted_days,
            'subtotal' => $this->subtotal,
            'tax_amount' => $this->tax_amount,
            'total_amount' => $this->total_amount,
            'currency' => $this->currency,
            'notes' => $this->notes,

            // Related resources
            'client' => new CustomerResource($this->whenLoaded('client')),
            'items' => InvoiceItemResource::collection($this->whenLoaded('items')),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
