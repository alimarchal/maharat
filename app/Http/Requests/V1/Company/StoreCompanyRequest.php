<?php

namespace App\Http\Requests\V1\Company;

use Illuminate\Foundation\Http\FormRequest;

class StoreCompanyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Adjust based on your authorization logic
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'name_ar' => ['nullable', 'string', 'max:255'],
            'website' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'contact_number' => ['nullable', 'string', 'max:20'],
            'fax' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'states_provinces' => ['nullable', 'string', 'max:100'],
            'district' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'street_name' => ['nullable', 'string', 'max:255'],
            'additional_street' => ['nullable', 'string', 'max:255'],
            'building_number' => ['nullable', 'string', 'max:50'],
            'additional_number' => ['nullable', 'string', 'max:50'],
            'short_address' => ['nullable', 'string', 'max:255'],
            'business_category' => ['nullable', 'string', 'max:100'],
            'id_type' => ['nullable', 'string', 'max:50'],
            'id_number' => ['nullable', 'string', 'max:50'],
            'logo' => ['nullable', 'file', 'image', 'mimes:jpeg,png,jpg,gif', 'max:4096'],
            'stamp' => ['nullable', 'file', 'image', 'mimes:jpeg,png,jpg,gif', 'max:4096'],
            'fiscal_year_start' => ['nullable', 'date'],
            'fiscal_year_end' => ['nullable', 'date', 'after:fiscal_year_start'],
            'price_decimals' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'quantity_decimals' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'amount_decimals' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'gazt_amount_decimals' => ['nullable', 'numeric', 'min:0', 'max:10'],
            'currency' => ['nullable', 'string', 'max:10'],
            'timezone' => ['nullable', 'string', 'max:50'],
            'session_expired_time' => ['nullable', 'integer', 'min:0'],
            'stop_login' => ['nullable', 'boolean'],
            'loyalty_use_phone_as_card' => ['nullable', 'boolean'],
            'zatca_environment' => ['nullable', 'in:sandbox,production'],
        ];
    }
}
