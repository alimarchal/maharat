<?php

namespace App\Http\Requests\RequestBudget;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRequestBudgetRequest extends FormRequest
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
     */
    public function rules(): array
    {
        return [
            'fiscal_period_id' => ['sometimes', 'exists:fiscal_periods,id'],
            'department_id' => ['sometimes', 'exists:departments,id'],
            'cost_center_id' => ['sometimes', 'exists:cost_centers,id'],
            'sub_cost_center' => ['nullable', 'exists:cost_centers,id'],
            'previous_year_revenue' => ['nullable', 'numeric', 'min:0'],
            'current_year_revenue' => ['nullable', 'numeric', 'min:0'],
            'previous_year_budget_amount' => ['nullable', 'numeric', 'min:0'],
            'requested_amount' => ['sometimes', 'numeric', 'min:0'],
            'approved_amount' => ['nullable', 'numeric', 'min:0'],
            'urgency' => ['nullable', Rule::in(['High', 'Medium', 'Low'])],
            'attachment_path' => ['nullable', 'string'],
            'reason_for_increase' => ['nullable', 'string'],
            'status' => ['nullable', Rule::in(['Draft', 'Submitted', 'Referred', 'Approved', 'Rejected', 'Pending'])],
        ];
    }
}
