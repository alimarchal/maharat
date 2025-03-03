<?php

namespace App\Http\Requests\V1\GrnReceiveGood;

use Illuminate\Foundation\Http\FormRequest;

class StoreGrnReceiveGoodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'exists:users,id'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'purchase_order_id' => ['nullable', 'exists:purchase_orders,id'],
            'quotation_id' => ['nullable', 'exists:quotations,id'],
            'quantity_quoted' => ['nullable', 'numeric', 'min:0'],
            'due_delivery_date' => ['nullable', 'date'],
            'receiver_name' => ['nullable', 'string', 'max:255'],
            'upc' => ['nullable', 'string', 'max:255'],
            'category_id' => ['nullable', 'exists:product_categories,id'],
            'quantity_delivered' => ['required', 'numeric', 'min:0'],
            'delivery_date' => ['required', 'date'],
        ];
    }
}
