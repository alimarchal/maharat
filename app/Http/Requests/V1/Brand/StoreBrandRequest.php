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
            'category_id' => ['nullable', 'exists:product_categories,id'],
            'name' => ['required'],
            'status_id' => ['required', 'exists:statuses,id']
        ];
    }
}
