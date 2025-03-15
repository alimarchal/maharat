<?php

namespace App\Http\Requests\V1\BudgetApprovalTransaction;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBudgetApprovalTransactionRequest extends FormRequest
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
            'budget_id' => ['required', 'exists:budgets,id'],
            'requester_id' => ['required', 'exists:users,id'],
            'assigned_to' => ['required', 'exists:users,id'],
            'referred_to' => ['nullable', 'exists:users,id'],
            'order' => ['nullable', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['Approve', 'Reject', 'Refer', 'Pending'])],
        ];
    }
}
