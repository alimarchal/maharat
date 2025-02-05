<?php

namespace App\Http\Requests\V1\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['sometimes', 'required', 'exists:product_categories,id'],
            'unit_id' => ['sometimes', 'required', 'exists:units,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'upc' => ['nullable', 'string', 'max:12', Rule::unique('products')->ignore($this->product)],
            'description' => ['nullable', 'string'],
        ];
    }
}
