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
            'fiscal_period_id' => 'required|exists:fiscal_periods,id',
            'department_id' => 'required|exists:departments,id',
            'cost_center_id' => 'required|exists:cost_centers,id',
            'sub_cost_center' => 'required|exists:cost_centers,id',
            'previous_year_revenue' => 'nullable|numeric|min:0',
            'current_year_revenue' => 'nullable|numeric|min:0',
            'previous_year_budget_amount' => 'required|numeric|min:0',
            'requested_amount' => 'required|numeric|min:0',
            'revenue_planned' => 'required|numeric|min:0',
            'approved_amount' => 'nullable|numeric|min:0',
            'reserved_amount' => 'nullable|numeric|min:0',
            'consumed_amount' => 'nullable|numeric|min:0',
            'balance_amount' => 'nullable|numeric|min:0',
            'urgency' => 'required|in:Low,Medium,High',
            'attachment_path' => 'nullable|string',
            'original_name' => 'nullable|string',
            'reason_for_increase' => 'nullable|string|max:1000',
            'status' => 'required|in:Draft,Pending,Approved,Rejected',
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $this->validateHierarchicalUniqueness($validator);
        });
    }

    /**
     * Validate hierarchical uniqueness
     */
    private function validateHierarchicalUniqueness($validator)
    {
        $fiscalPeriodId = $this->fiscal_period_id;
        $departmentId = $this->department_id;
        $costCenterId = $this->cost_center_id;
        $subCostCenter = $this->sub_cost_center;
        
        $subCostCenterConverted = is_numeric($subCostCenter) ? (int)$subCostCenter : $subCostCenter;
        
        $exists = \App\Models\RequestBudget::where('fiscal_period_id', $fiscalPeriodId)
            ->where('department_id', $departmentId)
            ->where('cost_center_id', $costCenterId)
            ->where('sub_cost_center', $subCostCenterConverted)
            ->exists();
        
        if ($exists) {
            $fiscalPeriod = \App\Models\FiscalPeriod::find($fiscalPeriodId);
            $department = \App\Models\Department::find($departmentId);
            $costCenter = \App\Models\CostCenter::find($costCenterId);
            $subCostCenterModel = \App\Models\CostCenter::find($subCostCenterConverted);
            
            $validator->errors()->add('hierarchical_uniqueness', "Budget request already exists for Fiscal Year: {$fiscalPeriod->fiscal_year}, Department: {$department->name}, Cost Center: {$costCenter->name}, Sub Cost Center: {$subCostCenterModel->name}");
        }
    }
}
