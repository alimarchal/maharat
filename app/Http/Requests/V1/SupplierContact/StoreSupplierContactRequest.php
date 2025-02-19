<?php

namespace App\Http\Requests\V1\SupplierContact;

use Illuminate\Foundation\Http\FormRequest;

class StoreSupplierContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'supplier_id' => 'required|exists:suppliers,id',
            'contact_name' => 'required|string|max:255',
            'designation' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:255',
            'is_primary' => 'boolean'
        ];
    }
}
