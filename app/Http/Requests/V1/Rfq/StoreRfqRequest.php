<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRfqRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            // Basic RFQ fields
            'company_id' => ['required', 'exists:companies,id'],
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'request_type_id' => ['required', 'exists:request_types,id'],
            'payment_type_id' => ['required', 'exists:payment_types,id'],
            'status_id' => ['required', 'exists:statuses,id'],
            'request_date' => ['required', 'date', 'before_or_equal:today'],
            'required_date' => ['required', 'date', 'after_or_equal:request_date'],
            'remarks' => ['nullable', 'string'],

            // Items validation
            'items' => ['required', 'array', 'min:1'],
            'items.*.category_id' => ['required', 'exists:product_categories,id'],
            'items.*.item_name' => ['required', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.unit_id' => ['required', 'exists:units,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.brand' => ['nullable', 'string', 'max:255'],
            'items.*.model' => ['nullable', 'string', 'max:255'],
            'items.*.specifications' => ['nullable', 'string'],
            'items.*.expected_delivery_date' => ['required', 'date', 'after_or_equal:request_date'],
            'items.*.status_id' => ['required', 'exists:statuses,id'],

            // Categories validation
            'category_ids' => ['nullable', 'array'],
            'category_ids.*' => ['exists:product_categories,id'],
        ];
    }

    public function messages()
    {
        return [
            'items.required' => 'At least one item is required for the RFQ.',
            'items.min' => 'At least one item is required for the RFQ.',
            'items.*.category_id.required' => 'Category is required for each item.',
            'items.*.item_name.required' => 'Item name is required.',
            'items.*.unit_id.required' => 'Unit is required for each item.',
            'items.*.quantity.min' => 'Quantity must be greater than 0.',
            'items.*.expected_delivery_date.after_or_equal' => 'Expected delivery date must be after or equal to the request date.',
        ];
    }
}
