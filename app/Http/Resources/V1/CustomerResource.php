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
            'commercial_registration_number' => $this->commercial_registration_number,
            'tax_number' => $this->tax_number,
            'tax_group_registration_number' => $this->tax_group_registration_number,
            'contact_number' => $this->contact_number,
            'additional_number' => $this->additional_number,
            'client_code' => $this->client_code,
            'license_number' => $this->license_number,
            'type' => $this->type,
            'is_limited' => $this->is_limited,

            // Address fields
            'street_name' => $this->street_name,
            'building_number' => $this->building_number,
            'address_additional_number' => $this->address_additional_number,
            'district' => $this->district,
            'neighborhood' => $this->neighborhood,
            'main_street' => $this->main_street,
            'city' => $this->city,
            'state' => $this->state,
            'zip_code' => $this->zip_code,
            'country_code' => $this->country_code,

            // Bank account fields
            'account_name' => $this->account_name,
            'account_number' => $this->account_number,
            'iban' => $this->iban,
            'swift_code' => $this->swift_code,
            'branch_name' => $this->branch_name,
            'bank_currency' => $this->bank_currency,

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
