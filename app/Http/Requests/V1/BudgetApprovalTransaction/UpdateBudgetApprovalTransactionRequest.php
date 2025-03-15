<?php

namespace App\Http\Requests\V1\BudgetApprovalTransaction;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBudgetApprovalTransactionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'budget_id' => ['sometimes', 'exists:budgets,id'],
            'requester_id' => ['sometimes', 'exists:users,id'],
            'assigned_to' => ['sometimes', 'exists:users,id'],
            'referred_to' => ['nullable', 'exists:users,id'],
            'order' => ['sometimes', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', Rule::in(['Approve', 'Reject', 'Refer', 'Pending'])],
        ];
    }
}
