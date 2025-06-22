<?php

namespace App\Http\Requests\V1\Account;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAccountRequest extends FormRequest
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
            'chart_of_account_id' => ['sometimes', 'exists:chart_of_accounts,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'account_code_id' => ['sometimes', 'exists:account_codes,id'],
            'cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'status' => ['nullable', 'in:Approved,Pending'],
            'credit_amount' => ['nullable', 'numeric', 'min:0'],
            'debit_amount' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'updated_by' => auth()->id(),
        ]);
    }
}
