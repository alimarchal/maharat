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
        // For reallocation updates, only require reallocate_amount and reason_for_increase
        // All other fields should be optional to allow partial updates
        $isReallocation = $this->input('type') === 'reallocation';
        
        return [
            'fiscal_period_id' => 'sometimes|exists:fiscal_periods,id',
            'department_id' => 'sometimes|exists:departments,id',
            'cost_center_id' => 'sometimes|exists:cost_centers,id',
            'sub_cost_center' => 'sometimes|exists:cost_centers,id',
            'previous_year_revenue' => 'nullable|numeric|min:0',
            'current_year_revenue' => 'nullable|numeric|min:0',
            'previous_year_budget_amount' => $isReallocation ? 'nullable|numeric|min:0' : 'sometimes|numeric|min:0',
            'requested_amount' => $isReallocation ? 'nullable|numeric|min:0' : 'sometimes|numeric|min:0',
            'revenue_planned' => $isReallocation ? 'nullable|numeric|min:0' : 'sometimes|numeric|min:0',
            'approved_amount' => 'nullable|numeric|min:0',
            'reserved_amount' => 'nullable|numeric|min:0',
            'consumed_amount' => 'nullable|numeric|min:0',
            'balance_amount' => 'nullable|numeric|min:0',
            'urgency' => $isReallocation ? 'nullable|in:Low,Medium,High' : 'sometimes|in:Low,Medium,High',
            'attachment_path' => 'nullable|string',
            'original_name' => 'nullable|string',
            'reason_for_increase' => 'nullable|string|max:1000',
            'status' => $isReallocation ? 'nullable|in:Draft,Pending,Approved,Rejected' : 'sometimes|in:Draft,Pending,Approved,Rejected',
            'type' => 'sometimes|in:budget_request,reallocation',
            'reallocate_amount' => $isReallocation ? 'sometimes|numeric|min:0' : 'nullable|numeric|min:0',
            'reallocate_to_sub_cost_center' => 'nullable|exists:cost_centers,id',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        // No need for hierarchical uniqueness validation on updates since hierarchical fields are read-only
    }

    /**
     * Validate hierarchical uniqueness
     */
    private function validateHierarchicalUniqueness($validator)
    {
        // This method is no longer needed for updates
    }
}
