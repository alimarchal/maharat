<?php

namespace App\Http\Requests\V1\EquityTransaction;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEquityTransactionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Adjust based on your authorization logic
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'equity_account_id' => ['sometimes', 'exists:equity_accounts,id'],
            'transaction_type' => [
                'sometimes',
                'string',
                Rule::in([
                    'owner_investment',
                    'owner_withdrawal',
                    'profit_allocation',
                    'loss_allocation',
                    'dividend_declaration',
                    'stock_issuance',
                    'stock_buyback',
                    'revaluation'
                ])
            ],
            'amount' => ['sometimes', 'numeric'],
            'transaction_date' => ['sometimes', 'date', 'before_or_equal:today'],
            'reference_number' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Automatically update the updater field
        $this->merge([
            'updated_by' => auth()->id(),
        ]);
    }
}
