<?php

namespace App\Http\Requests\V1\Grn;

use Illuminate\Foundation\Http\FormRequest;

class StoreGrnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'exists:users,id'],
            'grn_number' => ['required', 'string', 'unique:grns,grn_number'],
            'quotation_id' => ['nullable', 'exists:quotations,id'],
            'purchase_order_id' => ['nullable', 'exists:purchase_orders,id'],
            'quantity' => ['required', 'numeric', 'min:0'],
            'delivery_date' => ['required', 'date'],
        ];
    }
}
