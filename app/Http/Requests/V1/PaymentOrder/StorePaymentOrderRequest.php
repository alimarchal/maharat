<?php

namespace App\Http\Requests\V1\PaymentOrder;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'exists:users,id'],
            'purchase_order_id' => ['required', 'exists:purchase_orders,id'],
            'date' => ['nullable', 'date'],
            'attachment' => ['nullable', 'string'],
        ];
    }
}
