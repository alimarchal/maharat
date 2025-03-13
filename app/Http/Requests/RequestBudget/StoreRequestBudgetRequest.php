<?php

namespace App\Http\Requests\RequestBudget;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRequestBudgetRequest extends FormRequest
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
            'fiscal_period_id' => ['required', 'exists:fiscal_periods,id'],
            'department_id' => ['required', 'exists:departments,id'],
            'cost_center_id' => ['required', 'exists:cost_centers,id'],
            'sub_cost_center' => ['nullable', 'exists:cost_centers,id'],
            'previous_year_budget_amount' => ['nullable', 'numeric', 'min:0'],
            'requested_amount' => ['required', 'numeric', 'min:0'],
            'approved_amount' => ['nullable', 'numeric', 'min:0'],
            'urgency' => ['nullable', Rule::in(['High', 'Medium', 'Low'])],
            'attachment_path' => ['nullable', 'string'],
            'reason_for_increase' => ['nullable', 'string'],
            'status' => ['nullable', Rule::in(['Draft', 'Submitted', 'Referred', 'Approved', 'Rejected', 'Pending'])],
        ];
    }
}
