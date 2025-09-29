<?php

namespace App\Http\Requests\V1\Grn;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGrnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => 'nullable|exists:users,id',
            'grn_number' => 'nullable|string|max:255|unique:grns,grn_number',
            'quotation_id' => 'nullable|exists:quotations,id',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
            'quantity' => 'required|numeric|min:0',
            'delivery_date' => 'required|date',
            'delivery_status' => [
                'nullable',
                Rule::in(['complete_delivery', 'later_delivery', 'adjust_order'])
            ],
            'adjustment_notes' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'quantity.required' => 'Quantity is required.',
            'quantity.numeric' => 'Quantity must be a valid number.',
            'quantity.min' => 'Quantity must be greater than or equal to 0.',
            'delivery_date.required' => 'Delivery date is required.',
            'delivery_date.date' => 'Delivery date must be a valid date.',
            'delivery_status.in' => 'Invalid delivery status. Must be one of: complete_delivery, later_delivery, adjust_order.',
            'adjustment_notes.max' => 'Adjustment notes cannot exceed 1000 characters.',
        ];
    }
}
