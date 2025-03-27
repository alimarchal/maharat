<?php

namespace App\Http\Requests\V1\EquityAccount;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEquityAccountRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'max:255'],
            'account_code' => [
                'sometimes',
                'string',
                Rule::unique('equity_accounts', 'account_code')->ignore($this->equityAccount)
            ],
            'type' => [
                'sometimes',
                'string',
                Rule::in(['owner_capital', 'retained_earnings', 'drawings', 'contributed_capital', 'treasury_stock', 'other_equity'])
            ],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
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
