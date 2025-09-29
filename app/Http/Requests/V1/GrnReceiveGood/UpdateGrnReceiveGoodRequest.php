<?php

namespace App\Http\Requests\V1\GrnReceiveGood;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGrnReceiveGoodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => 'sometimes|exists:users,id',
            'grn_id' => 'sometimes|exists:grns,id',
            'supplier_id' => 'sometimes|exists:suppliers,id',
            'purchase_order_id' => 'sometimes|exists:purchase_orders,id',
            'quotation_id' => 'sometimes|exists:quotations,id',
            'quantity_quoted' => 'sometimes|numeric|min:0',
            'due_delivery_date' => 'sometimes|date',
            'receiver_name' => 'sometimes|string|max:255',
            'upc' => 'sometimes|string|max:255',
            'category_id' => 'sometimes|exists:product_categories,id',
            'quantity_delivered' => 'sometimes|numeric|min:0|lte:quantity_quoted',
            'quantity_pending' => 'sometimes|numeric|min:0',
            'delivery_date' => 'sometimes|date',
            'delivery_status' => [
                'sometimes',
                Rule::in(['complete_delivery', 'later_delivery', 'adjust_order'])
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'quantity_quoted.numeric' => 'Quoted quantity must be a valid number.',
            'quantity_quoted.min' => 'Quoted quantity must be greater than or equal to 0.',
            'receiver_name.max' => 'Receiver name cannot exceed 255 characters.',
            'quantity_delivered.numeric' => 'Delivered quantity must be a valid number.',
            'quantity_delivered.min' => 'Delivered quantity must be greater than or equal to 0.',
            'quantity_delivered.lte' => 'Delivered quantity cannot exceed quoted quantity.',
            'delivery_date.date' => 'Delivery date must be a valid date.',
            'delivery_status.in' => 'Invalid delivery status. Must be one of: complete_delivery, later_delivery, adjust_order.',
        ];
    }
}
