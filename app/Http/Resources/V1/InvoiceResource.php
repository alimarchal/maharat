<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'client_id' => $this->client_id,
            'company_id' => $this->company_id,
            'client' => new CustomerResource($this->whenLoaded('client')),
            'status' => $this->status,
            'payment_method' => $this->payment_method,
            'representative' => $this->representative, 
            'representative_email' => $this->representative_email, 
            'issue_date' => $this->issue_date,
            'due_date' => $this->due_date,
            'discounted_days' => $this->discounted_days,  
            'vat_rate' => $this->vat_rate, 
            'subtotal' => $this->subtotal,
            'tax_amount' => $this->tax_amount,
            'discount_amount' => $this->discount_amount,  
            'total_amount' => $this->total_amount,
            'currency' => $this->currency,
            'notes' => $this->notes, 
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
