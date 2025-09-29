<?php

namespace App\Http\Requests\V1\GrnReceiveGood;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreGrnReceiveGoodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => 'nullable|exists:users,id',
            'grn_id' => 'nullable|exists:grns,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
            'quotation_id' => 'nullable|exists:quotations,id',
            'quantity_quoted' => 'required|numeric|min:0',
            'due_delivery_date' => 'nullable|date',
            'receiver_name' => 'required|string|max:255',
            'upc' => 'nullable|string|max:255',
            'category_id' => 'nullable|exists:product_categories,id',
            'quantity_delivered' => 'required|numeric|min:0|lte:quantity_quoted',
            'quantity_pending' => 'nullable|numeric|min:0',
            'delivery_date' => 'required|date',
            'delivery_status' => [
                'nullable',
                Rule::in(['complete_delivery', 'later_delivery', 'adjust_order'])
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'quantity_quoted.required' => 'Quoted quantity is required.',
            'quantity_quoted.numeric' => 'Quoted quantity must be a valid number.',
            'quantity_quoted.min' => 'Quoted quantity must be greater than or equal to 0.',
            'receiver_name.required' => 'Receiver name is required.',
            'receiver_name.max' => 'Receiver name cannot exceed 255 characters.',
            'quantity_delivered.required' => 'Delivered quantity is required.',
            'quantity_delivered.numeric' => 'Delivered quantity must be a valid number.',
            'quantity_delivered.min' => 'Delivered quantity must be greater than or equal to 0.',
            'quantity_delivered.lte' => 'Delivered quantity cannot exceed quoted quantity.',
            'delivery_date.required' => 'Delivery date is required.',
            'delivery_date.date' => 'Delivery date must be a valid date.',
            'delivery_status.in' => 'Invalid delivery status. Must be one of: complete_delivery, later_delivery, adjust_order.',
        ];
    }
}
