<?php

namespace App\Http\Requests\V1\SupplierAddress;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSupplierAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'supplier_id' => 'sometimes|required|exists:suppliers,id',
            'address_type' => 'sometimes|required|string|max:255',
            'street_address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'country' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:255'
        ];
    }
}
