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
            'email' => ['nullable', 'string', 'email'],
            'commercial_registration_number' => [
                'nullable',
                'string',
                Rule::unique('customers', 'commercial_registration_number')->ignore($this->customer),
            ],
            'vat_number' => [
                'nullable',
                'string',
                Rule::unique('customers', 'vat_number')->ignore($this->customer),
            ],
            'tax_group_registration_number' => ['nullable', 'string'],
            'cr_no' => ['nullable', 'string'],
            'contact_number' => ['nullable', 'string'],
            'additional_number' => ['nullable', 'string'],
            'client_code' => ['nullable', 'string'],
            'license_number' => ['nullable', 'string'],
            'type' => ['sometimes', 'required', 'string', 'in:regular,vendor,client,both'],
            'is_limited' => ['boolean'],

            // Address fields
            'address' => ['nullable', 'string'],
            'zip_code' => ['nullable', 'string'],
            'country_code' => ['nullable', 'string', 'max:3'],

            // Bank account fields
            'account_name' => ['nullable', 'string'],
            'representative_name' => ['nullable', 'string', 'max:255'],
            'account_number' => ['nullable', 'string'],
            'iban' => ['nullable', 'string'],
            'swift_code' => ['nullable', 'string'],
            'bank_name' => ['nullable', 'string'],
            'branch_name' => ['nullable', 'string'],
            'bank_currency' => ['nullable', 'string', 'max:3', 'in:SAR,USD,EUR'],

            // Payment method
            'preferred_payment_method' => ['nullable', 'string'],

            // Tax information
            'default_tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'is_tax_exempt' => ['boolean'],
        ];
    }
}
