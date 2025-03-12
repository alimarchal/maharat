<?php

namespace App\Http\Requests\V1\MaterialRequestTransaction;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMaterialRequestTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'material_request_id' => ['sometimes', 'required', 'exists:material_requests,id'],
            'requester_id' => ['sometimes', 'required', 'exists:users,id'],
            'assigned_to' => ['nullable', 'exists:users,id'],
            'referred_to' => ['nullable', 'exists:users,id'],
            'order' => ['nullable'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'required', Rule::in(['Approve', 'Reject', 'Refer', 'Pending'])],
        ];
    }
}
