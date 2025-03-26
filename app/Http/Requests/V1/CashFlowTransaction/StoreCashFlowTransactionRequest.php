<?php

namespace App\Http\Requests\V1\CashFlowTransaction;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCashFlowTransactionRequest extends FormRequest
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
            'transaction_date' => ['sometimes', 'date'],
            'transaction_type' => ['required', Rule::in(['Debit', 'Credit'])],
            'chart_of_account_id' => ['nullable', 'exists:chart_of_accounts,id'],
            'sub_cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'account_id' => ['nullable', 'exists:accounts,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', Rule::in(['Cash', 'Bank Transfer', 'Credit Card'])],
            'reference_number' => ['nullable', 'string', 'max:50'],
            'reference_type' => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
        ];
    }
}
