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
            'grn_number' => ['nullable', 'string', 'unique:grns,grn_number'],
            'quotation_id' => ['nullable', 'exists:quotations,id'],
            'purchase_order_id' => ['nullable', 'exists:purchase_orders,id'],
            'quantity' => ['required', 'numeric', 'min:0'],
            'expected_quantity' => ['nullable', 'numeric', 'min:0'],
            'delivery_status' => ['nullable', 'in:complete,partial,awaiting_remaining'],
            'delivery_notes' => ['nullable', 'string', 'max:1000'],
            'delivery_date' => ['required', 'date'],
            'action' => ['nullable', 'in:expect_later,adjust_close'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
