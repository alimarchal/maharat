<?php

namespace App\Http\Requests\V1\BudgetUsage;

use Illuminate\Foundation\Http\FormRequest;

class StoreBudgetUsageRequest extends FormRequest
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
            'sub_cost_center' => ['required', 'exists:cost_centers,id'],
            'fiscal_period_id' => ['required', 'exists:fiscal_periods,id'],
            'sub_cost_center_approved_amount' => ['nullable', 'numeric', 'min:0'],
            'sub_cost_center_reserved_amount' => ['nullable', 'numeric', 'min:0'],
            'sub_cost_center_consumed_amount' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
