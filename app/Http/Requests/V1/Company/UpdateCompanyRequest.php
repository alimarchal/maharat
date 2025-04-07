<?php

namespace App\Http\Requests\V1\Company;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Adjust based on your authorization logic
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'name_ar' => ['sometimes', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'string',
                'email',
                'max:255',
                Rule::unique('companies')->ignore($this->company),
            ],
            'contact_number' => ['sometimes', 'string', 'max:20'],
            'address' => ['sometimes', 'string', 'max:255'],
            'website' => ['sometimes', 'string', 'max:255'],
            'country' => ['sometimes', 'string', 'max:100'],
            'city' => ['sometimes', 'string', 'max:100'],
            'postal_code' => ['sometimes', 'string', 'max:20'],
            'bank' => ['sometimes', 'string', 'max:100'],
            'branch' => ['sometimes', 'string', 'max:100'],
            'swift' => ['sometimes', 'string', 'max:50'],
            'account_name' => ['sometimes', 'string', 'max:100'],
            'account_no' => ['sometimes', 'string', 'max:50'],
            'currency_id' => ['sometimes', 'integer', 'exists:currencies,id'],
            'iban' => ['sometimes', 'string', 'max:50'],
            'license_no' => ['sometimes', 'string', 'max:50'],
            'vat_no' => ['sometimes', 'string', 'max:50'],
            'cr_no' => ['sometimes', 'string', 'max:50'],
            'logo' => ['sometimes', 'file', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
            'logo_path' => ['sometimes', 'string', 'max:255'],
            'stamp' => ['sometimes', 'file', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
            'stamp_path' => ['sometimes', 'string', 'max:255'],
        ];
    }
}
