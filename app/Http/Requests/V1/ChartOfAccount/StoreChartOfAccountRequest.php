<?php

namespace App\Http\Requests\V1\ChartOfAccount;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreChartOfAccountRequest extends FormRequest
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
            'account_code' => ['required', 'string', 'unique:chart_of_accounts,account_code'],
            'account_name' => ['required', 'string', 'max:255'],
            'account_type' => ['required', Rule::in(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'])],
            'parent_account_id' => ['nullable', 'exists:chart_of_accounts,id'],
            'is_active' => ['boolean'],
            'description' => ['nullable', 'string'],
        ];
    }
}
