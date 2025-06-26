<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\RequestBudgetResource;

class InvoiceResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'client_id' => $this->client_id,
            'status' => $this->status,
            'payment_method' => $this->payment_method,
            'representative_id' => $this->representative_id,
            'representative_name' => $this->representative_name,

            'representative' => $this->whenLoaded('representative', function () {
                return [
                    'id' => $this->representative->id,
                    'name' => $this->representative->name,
                ];
            }),

            'representative_email' => $this->representative_email,
            'issue_date' => $this->issue_date,
            'due_date' => $this->due_date,
            'discounted_days' => $this->discounted_days,
            'vat_rate' => $this->vat_rate,
            'subtotal' => $this->subtotal,
            'tax_amount' => $this->tax_amount,
            'discount_amount' => $this->discount_amount,
            'total_amount' => $this->total_amount,
            'paid_amount' => $this->paid_amount,
            'currency' => $this->currency,
            'notes' => $this->notes,
            'account_code_id' => $this->account_code_id,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,

            'client' => new CustomerResource($this->whenLoaded('client')),
            'items' => InvoiceItemResource::collection($this->whenLoaded('items')),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
