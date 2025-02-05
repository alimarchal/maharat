<?php

namespace App\Http\Requests\V1\MaterialRequestItem;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaterialRequestItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'material_request_id' => ['required', 'exists:material_requests,id'],
            'product_id' => ['required', 'exists:products,id'],
            'unit_id' => ['required', 'exists:units,id'],
            'category_id' => ['required', 'exists:product_categories,id'],
            'quantity' => ['required', 'numeric', 'min:0.0001'],
            'urgency' => ['required', 'exists:statuses,id'],
            'description' => ['nullable', 'string'],
            'photo' => ['nullable', 'string'], // Adjust based on your file upload handling
        ];
    }
}
