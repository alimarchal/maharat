<?php

namespace App\Http\Requests\V1\GrnReceiveGood;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGrnReceiveGoodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['sometimes', 'nullable', 'exists:users,id'],
            'grn_id' => ['sometimes', 'nullable', 'exists:grns,id'],
            'supplier_id' => ['sometimes', 'required', 'exists:suppliers,id'],
            'purchase_order_id' => ['sometimes', 'nullable', 'exists:purchase_orders,id'],
            'quotation_id' => ['sometimes', 'nullable', 'exists:quotations,id'],
            'quantity_quoted' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'due_delivery_date' => ['sometimes', 'nullable', 'date'],
            'receiver_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'upc' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category_id' => ['sometimes', 'nullable', 'exists:product_categories,id'],
            'quantity_delivered' => ['sometimes', 'required', 'numeric', 'min:0'],
            'delivery_date' => ['sometimes', 'required', 'date'],
        ];
    }
}
