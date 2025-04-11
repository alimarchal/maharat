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
            'cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'sub_cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'date' => ['nullable', 'date'],
            'attachment' => ['nullable', 'string'],
            'total_amount' => ['nullable', 'string'],
            'paid_amount' => ['nullable', 'string'],
            'status' => ['nullable', 'string'],
        ];
    }
}
