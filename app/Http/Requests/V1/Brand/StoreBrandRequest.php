<?php

namespace App\Http\Requests\V1\Brand;

use Illuminate\Foundation\Http\FormRequest;

class StoreBrandRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255|unique:brands,code',
            'description' => 'nullable|string',
            'website' => 'nullable|url|max:255',
            'status_id' => 'nullable|exists:statuses,id'
        ];
    }
}
