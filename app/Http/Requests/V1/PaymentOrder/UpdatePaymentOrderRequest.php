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
            'cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'sub_cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'date' => ['nullable', 'date'],
            'issue_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date'],
            'payment_type' => ['nullable', 'string', 'in:Cash,Card,Bank Transfer,Cheque'],
            'attachment' => ['nullable', 'string'],
            'total_amount' => ['nullable', 'string'],
            'paid_amount' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:Draft,Approved,Overdue,Cancelled,Paid,Pending,Partially Paid'],
        ];
    }
}
