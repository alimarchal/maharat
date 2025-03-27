<?php

namespace App\Http\Requests\V1\PaymentOrder;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePaymentOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['sometimes', 'nullable', 'exists:users,id'],
            'purchase_order_id' => ['sometimes', 'required', 'exists:purchase_orders,id'],
            'date' => ['nullable', 'date'],
            'attachment' => ['nullable', 'string'],
            'total_amount' => ['nullable', 'string'],
            'paid_amount' => ['nullable', 'string'],
            'status' => ['nullable', 'string'],
        ];
    }
}
