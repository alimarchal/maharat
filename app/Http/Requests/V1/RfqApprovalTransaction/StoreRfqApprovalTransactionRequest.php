<?php

namespace App\Http\Requests\V1\RfqApprovalTransaction;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRfqApprovalTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rfq_id' => ['required', 'exists:rfqs,id'],
            'requester_id' => ['required', 'exists:users,id'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'referred_to' => ['nullable', 'exists:users,id'],
            'order' => ['nullable', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['Approve', 'Reject', 'Refer', 'Pending'])],
            'created_by' => ['nullable', 'exists:users,id'],
            'updated_by' => ['nullable', 'exists:users,id'],
        ];
    }
}
