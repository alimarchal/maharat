<?php

namespace App\Http\Requests\V1\Brand;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBrandRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['sometimes', 'nullable', 'exists:product_categories,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'status_id' => ['sometimes', 'required', 'exists:statuses,id']
        ];
    }
}
