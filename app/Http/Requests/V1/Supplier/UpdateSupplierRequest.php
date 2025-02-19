<?php

namespace App\Http\Requests\V1\Supplier;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSupplierRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('suppliers', 'code')->ignore($this->supplier)
            ],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('suppliers', 'email')->ignore($this->supplier)
            ],
            'phone' => 'nullable|string|max:255',
            'website' => 'nullable|url|max:255',
            'tax_number' => 'nullable|string|max:255',
            'payment_terms' => 'nullable|string',
            'is_approved' => 'boolean',
            'currency_id' => 'nullable|exists:currencies,id',
            'status_id' => 'nullable|exists:statuses,id',

            // Nested contacts validation
            'contacts' => 'nullable|array',
            'contacts.*.contact_name' => 'required|string|max:255',
            'contacts.*.designation' => 'nullable|string|max:255',
            'contacts.*.email' => 'nullable|email|max:255',
            'contacts.*.phone' => 'nullable|string|max:255',
            'contacts.*.is_primary' => 'boolean',

            // Nested addresses validation
            'addresses' => 'nullable|array',
            'addresses.*.address_type' => 'required|string|max:255',
            'addresses.*.street_address' => 'nullable|string|max:255',
            'addresses.*.city' => 'nullable|string|max:255',
            'addresses.*.state' => 'nullable|string|max:255',
            'addresses.*.country' => 'nullable|string|max:255',
            'addresses.*.postal_code' => 'nullable|string|max:255'
        ];
    }
}
