<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'cr_no' => $this->cr_no,
            'vat_number' => $this->vat_number,
            'contact_number' => $this->contact_number,
            'additional_number' => $this->additional_number,
            'client_code' => $this->client_code,
            'license_number' => $this->license_number,
            'type' => $this->type,
            'is_limited' => $this->is_limited,
    
            // Address field
            'address' => $this->address, // Combined address fields
            'zip_code' => $this->zip_code,
            'country_code' => $this->country_code,
    
            // Bank account fields
            'account_name' => $this->account_name,
            'representative_name' => $this->representative_name,
            'account_number' => $this->account_number,
            'iban' => $this->iban,
            'swift_code' => $this->swift_code,
            'bank_name' => $this->bank_name, // Added missing bank_name
            'branch_name' => $this->branch_name,
            'bank_currency' => $this->bank_currency ?? 'SAR', // Default to SAR
    
            // Payment method
            'preferred_payment_method' => $this->preferred_payment_method,
    
            // Tax information
            'default_tax_rate' => $this->default_tax_rate,
            'is_tax_exempt' => $this->is_tax_exempt,
    
            // Related resources
            'sent_invoices' => InvoiceResource::collection($this->whenLoaded('sentInvoices')),
            'received_invoices' => InvoiceResource::collection($this->whenLoaded('receivedInvoices')),
    
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
    
}
