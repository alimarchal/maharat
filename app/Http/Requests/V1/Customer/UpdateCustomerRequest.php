<?php

namespace App\Http\Requests\V1\Customer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'commercial_registration_number' => [
                'nullable',
                'string',
                Rule::unique('customers')->ignore($this->customer)
            ],
            'tax_number' => [
                'nullable',
                'string',
                Rule::unique('customers')->ignore($this->customer)
            ],
            'tax_group_registration_number' => ['nullable', 'string'],
            'contact_number' => ['nullable', 'string'],
            'additional_number' => ['nullable', 'string'],
            'client_code' => ['nullable', 'string'],
            'license_number' => ['nullable', 'string'],
            'type' => ['sometimes', 'required', 'string', 'in:regular,vendor,client,both'],
            'is_limited' => ['boolean'],

            // Address fields
            'street_name' => ['nullable', 'string'],
            'building_number' => ['nullable', 'string'],
            'address_additional_number' => ['nullable', 'string'],
            'district' => ['nullable', 'string'],
            'neighborhood' => ['nullable', 'string'],
            'main_street' => ['nullable', 'string'],
            'city' => ['nullable', 'string'],
            'state' => ['nullable', 'string'],
            'zip_code' => ['nullable', 'string'],
            'country_code' => ['nullable', 'string', 'max:3'],

            // Bank account fields
            'account_name' => ['nullable', 'string'],
            'account_number' => ['nullable', 'string'],
            'iban' => ['nullable', 'string'],
            'swift_code' => ['nullable', 'string'],
            'branch_name' => ['nullable', 'string'],
            'bank_currency' => ['nullable', 'string', 'max:3'],

            // Payment method
            'preferred_payment_method' => ['nullable', 'string'],

            // Tax information
            'default_tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'is_tax_exempt' => ['boolean'],
        ];
    }
}
