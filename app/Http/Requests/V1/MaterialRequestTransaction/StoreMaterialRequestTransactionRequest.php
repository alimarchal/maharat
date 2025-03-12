<?php

namespace App\Http\Requests\V1\MaterialRequestTransaction;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMaterialRequestTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'material_request_id' => ['required', 'exists:material_requests,id'],
            'requester_id' => ['required', 'exists:users,id'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'referred_to' => ['nullable', 'exists:users,id'],
            'order' => ['nullable', 'string'],
            'description' => ['nullable'],
            'status' => ['required', Rule::in(['Approve', 'Reject', 'Refer', 'Pending'])],
        ];
    }
}
