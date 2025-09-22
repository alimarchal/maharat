<?php

namespace App\Http\Requests\V1\MaterialRequest;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMaterialRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'requester_id' => ['sometimes', 'required', 'exists:users,id'],
            'warehouse_id' => ['sometimes', 'required', 'exists:warehouses,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'sub_cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'expected_delivery_date' => ['sometimes', 'required', 'date', 'after_or_equal:today'],
            'status_id' => ['sometimes', 'required', 'exists:statuses,id'],

            // Nested items validation
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.unit_id' => ['required', 'exists:units,id'],
            'items.*.category_id' => ['required', 'exists:product_categories,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.0001'],
            'items.*.urgency' => ['required', 'exists:statuses,id'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.photo' => ['nullable', 'file', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
        ];
    }
}
