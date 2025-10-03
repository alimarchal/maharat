<?php

namespace App\Http\Requests\V1\GrnApprovalTransaction;

use Illuminate\Foundation\Http\FormRequest;

class StoreGrnApprovalTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'grn_id' => ['required', 'exists:grns,id'],
            'requester_id' => ['required', 'exists:users,id'],
            'assigned_to' => ['required', 'exists:users,id'],
            'referred_to' => ['nullable', 'exists:users,id'],
            'order' => ['required', 'integer', 'min:1'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:Pending,Approve,Reject'],
        ];
    }
}
