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
            'status' => $this->status,
            'payment_method' => $this->payment_method,
            'representative_id' => $this->representative_id,
            
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
            'currency' => $this->currency,
            'notes' => $this->notes,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,

            'company' => $this->whenLoaded('company', function () {
                return [
                    'id' => $this->company->id,
                    'name' => $this->company->name,
                    'address' => $this->company->address,
                    'cr_no' => $this->company->cr_no,
                    'vat_no' => $this->company->vat_no,
                    'contact_number' => $this->company->contact_number,
                    'email' => $this->company->email,
                    'account_name' => $this->company->account_name,
                    'account_no' => $this->company->account_no,
                    'license_no' => $this->company->license_no,
                    'iban' => $this->company->iban,
                    'bank' => $this->company->bank,
                    'branch' => $this->company->branch,
                    'swift' => $this->company->swift,
                    'currency' => $this->whenLoaded('currency', function () {
                        return [
                            'id' => $this->company->currency->id,
                            'name' => $this->company->currency->name,
                        ];
                    }),
                ];
            }),

            'client' => new CustomerResource($this->whenLoaded('client')),
            'items' => InvoiceItemResource::collection($this->whenLoaded('items')),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
