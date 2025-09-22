<?php

namespace App\Http\Requests\V1\MaterialRequestItem;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMaterialRequestItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['sometimes', 'required', 'exists:products,id'],
            'unit_id' => ['sometimes', 'required', 'exists:units,id'],
            'category_id' => ['sometimes', 'required', 'exists:product_categories,id'],
            'quantity' => ['sometimes', 'required', 'numeric', 'min:0.0001'],
            'urgency' => ['sometimes', 'required', 'exists:statuses,id'],
            'description' => ['nullable', 'string'],
            'photo' => ['nullable', 'file', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
        ];
    }
}
