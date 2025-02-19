<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupplierResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'email' => $this->email,
            'phone' => $this->phone,
            'website' => $this->website,
            'tax_number' => $this->tax_number,
            'payment_terms' => $this->payment_terms,
            'is_approved' => $this->is_approved,
            'currency_id' => $this->currency_id,
            'status_id' => $this->status_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Include related resources when loaded
            'contacts' => SupplierContactResource::collection($this->whenLoaded('contacts')),
            'addresses' => SupplierAddressResource::collection($this->whenLoaded('addresses')),
            'currency' => new CurrencyResource($this->whenLoaded('currency')),
            'status' => new StatusResource($this->whenLoaded('status'))
        ];
    }
}
