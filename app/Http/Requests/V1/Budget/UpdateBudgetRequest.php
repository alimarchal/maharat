<?php

namespace App\Http\Requests\V1\Budget;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBudgetRequest extends FormRequest
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
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'fiscal_period_id' => ['sometimes', 'required', 'exists:fiscal_periods,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'sub_cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'description' => ['nullable', 'string', 'max:255'],
            'total_revenue_planned' => ['sometimes', 'required', 'numeric', 'min:0'],
            'total_revenue_actual' => ['nullable', 'numeric', 'min:0'],
            'total_expense_planned' => ['sometimes', 'required', 'numeric', 'min:0'],
            'total_expense_actual' => ['nullable', 'numeric', 'min:0'],
            'status' => ['sometimes', 'required', Rule::in(['Pending', 'Active', 'Frozen', 'Closed'])],
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
