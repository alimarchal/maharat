<?php

namespace App\Http\Requests\V1\MaterialRequest;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaterialRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'requester_id' => ['required', 'exists:users,id'],
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'expected_delivery_date' => ['required', 'date', 'after_or_equal:today'],
            'status_id' => ['required', 'exists:statuses,id'],

            // Nested items validation
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.unit_id' => ['required', 'exists:units,id'],
            'items.*.category_id' => ['required', 'exists:product_categories,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.0001'],
            'items.*.urgency' => ['required', 'exists:statuses,id'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.photo' => ['nullable', 'string'], // Adjust based on your file upload handling
        ];
    }
}
