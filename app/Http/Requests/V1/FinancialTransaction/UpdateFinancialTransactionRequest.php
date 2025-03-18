<?php

namespace App\Http\Requests\V1\FinancialTransaction;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFinancialTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'account_code_id' => ['sometimes', 'nullable', 'exists:account_codes,id'],
            'chart_of_account_id' => ['sometimes', 'nullable', 'exists:chart_of_accounts,id'],
            'account_id' => ['sometimes', 'nullable', 'exists:accounts,id'],
            'department_id' => ['sometimes', 'nullable', 'exists:departments,id'],
            'cost_center_id' => ['sometimes', 'nullable', 'exists:cost_centers,id'],
            'sub_cost_center_id' => ['sometimes', 'nullable', 'exists:cost_centers,id'],
            'transaction_date' => ['sometimes', 'required', 'date'],
            'entry_type' => ['sometimes', 'required', Rule::in(['Regular', 'Adjustment', 'Closing', 'Opening', 'Reversal'])],
            'status' => ['sometimes', 'required', Rule::in(['Draft', 'Posted', 'Approved', 'Canceled', 'Reversed'])],
            'fiscal_period_id' => ['sometimes', 'required', 'exists:fiscal_periods,id'],
            'reference_number' => ['sometimes', 'nullable', 'string', 'max:255'],
            'amount' => ['sometimes', 'required', 'numeric', 'decimal:0,2'],
            'description' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
