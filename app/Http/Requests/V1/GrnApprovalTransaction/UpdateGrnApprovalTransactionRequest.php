<?php

namespace App\Http\Requests\V1\GrnApprovalTransaction;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGrnApprovalTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'assigned_to' => ['sometimes', 'exists:users,id'],
            'referred_to' => ['nullable', 'exists:users,id'],
            'order' => ['sometimes', 'integer', 'min:1'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:Pending,Approve,Reject'],
        ];
    }
}
