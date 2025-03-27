<?php

namespace App\Http\Requests\V1\EquityAccount;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreEquityAccountRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255'],
            'account_code' => ['nullable', 'string', 'unique:equity_accounts,account_code'],
            'type' => [
                'required',
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
        // Automatically add the authenticated user as creator
        $this->merge([
            'created_by' => auth()->id(),
            'updated_by' => auth()->id(),
        ]);
    }
}
