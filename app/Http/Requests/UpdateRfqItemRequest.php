<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRfqItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id' => ['sometimes', 'required', 'exists:product_categories,id'],
            'item_name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'unit_id' => ['sometimes', 'required', 'exists:units,id'],
            'quantity' => ['sometimes', 'required', 'numeric', 'min:0.0001'],
            'brand' => ['nullable', 'string', 'max:255'],
            'model' => ['nullable', 'string', 'max:255'],
            'specifications' => ['nullable', 'string'],
            'attachment' => ['nullable', 'string'],
            'expected_delivery_date' => ['sometimes', 'required', 'date'],
            'quoted_price' => ['nullable', 'numeric', 'min:0'],
            'negotiated_price' => ['nullable', 'numeric', 'min:0'],
            'status_id' => ['sometimes', 'required', 'exists:statuses,id'],
        ];
    }
}
