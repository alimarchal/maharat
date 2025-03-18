<?php

namespace App\Http\Requests\V1\FinancialTransaction;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFinancialTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'account_code_id' => ['nullable', 'exists:account_codes,id'],
            'chart_of_account_id' => ['nullable', 'exists:chart_of_accounts,id'],
            'account_id' => ['nullable', 'exists:accounts,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'sub_cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'transaction_date' => ['required', 'date'],
            'entry_type' => ['required', Rule::in(['Regular', 'Adjustment', 'Closing', 'Opening', 'Reversal'])],
            'status' => ['required', Rule::in(['Draft', 'Posted', 'Approved', 'Canceled', 'Reversed'])],
            'fiscal_period_id' => ['required', 'exists:fiscal_periods,id'],
            'reference_number' => ['nullable', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'decimal:0,2'],
            'description' => ['nullable', 'string'],
        ];
    }
}
