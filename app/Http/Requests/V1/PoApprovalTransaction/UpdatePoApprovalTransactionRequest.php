<?php

namespace App\Http\Requests\V1\PoApprovalTransaction;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePoApprovalTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'purchase_order_id' => ['sometimes', 'required', 'exists:purchase_orders,id'],
            'requester_id' => ['sometimes', 'required', 'exists:users,id'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'referred_to' => ['nullable', 'exists:users,id'],
            'order' => ['nullable', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'required', Rule::in(['Approve', 'Reject', 'Refer', 'Pending'])],
            'created_by' => ['nullable', 'exists:users,id'],
            'updated_by' => ['nullable', 'exists:users,id'],
        ];
    }
}
