<?php

namespace App\Http\Requests\V1\AssetTransaction;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAssetTransactionRequest extends FormRequest
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
            'asset_id' => ['required', 'exists:assets,id'],
            'transaction_type' => [
                'required',
                'string',
                Rule::in(['acquisition', 'depreciation', 'revaluation', 'maintenance', 'disposal', 'transfer'])
            ],
            'amount' => ['required', 'numeric'],
            'transaction_date' => ['required', 'date', 'before_or_equal:today'],
            'reference_number' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
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
        ]);
    }
}
