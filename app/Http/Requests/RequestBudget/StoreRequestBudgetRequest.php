<?php

namespace App\Http\Requests\RequestBudget;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Log;
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
        $type = $this->input('type');

        // Base rules
        $rules = [
            'fiscal_period_id' => 'required|exists:fiscal_periods,id',
            'department_id' => 'nullable|exists:departments,id',
            'cost_center_id' => 'nullable|exists:cost_centers,id',
            'sub_cost_center' => 'nullable|exists:cost_centers,id',
            'previous_year_revenue' => 'nullable|numeric|min:0',
            'current_year_revenue' => 'nullable|numeric|min:0',
            'previous_year_budget_amount' => 'nullable|numeric|min:0',
            'requested_amount' => 'nullable|numeric|min:0',
            'revenue_planned' => 'nullable|numeric|min:0',
            'approved_amount' => 'nullable|numeric|min:0',
            'reserved_amount' => 'nullable|numeric|min:0',
            'consumed_amount' => 'nullable|numeric|min:0',
            'balance_amount' => 'nullable|numeric|min:0',
            'old_balance' => 'nullable|numeric|min:0',
            'reallocate_amount' => 'nullable|numeric|min:0',
            'reallocate_to_sub_cost_center' => 'nullable|exists:cost_centers,id',
            'destination_old_balance' => 'nullable|numeric|min:0',
            'type' => 'nullable|in:budget_request,reallocation,vat',
            'urgency' => 'nullable|in:Low,Medium,High',
            'attachment_path' => 'nullable|string',
            'original_name' => 'nullable|string',
            'reason_for_increase' => 'nullable|string|max:1000',
            'status' => 'required|in:Draft,Pending,Approved,Rejected',
        ];

        // For regular budget requests (department budgets), make certain fields required
        if ($type === null || $type === 'budget_request') {
            $rules['department_id'] = 'required|exists:departments,id';
            $rules['cost_center_id'] = 'required|exists:cost_centers,id';
            $rules['previous_year_budget_amount'] = 'required|numeric|min:0';
            $rules['requested_amount'] = 'required|numeric|min:0';
            $rules['revenue_planned'] = 'required|numeric|min:0';
            $rules['urgency'] = 'required|in:Low,Medium,High';
        } elseif ($type === 'reallocation') {
            // For reallocations, make reallocation-specific fields required
            $rules['reallocate_amount'] = 'required|numeric|min:1';
            $rules['reallocate_to_sub_cost_center'] = 'required|exists:cost_centers,id';
            // Department and cost center are still required for reallocations
            $rules['department_id'] = 'required|exists:departments,id';
            $rules['cost_center_id'] = 'required|exists:cost_centers,id';
        } elseif ($type === 'vat') {
            // VAT budget: one main VAT budget per fiscal year (period), no department/cost center/sub cost center
            // Keep the same financial fields as normal budget requests
            $rules['previous_year_budget_amount'] = 'required|numeric|min:0';
            $rules['requested_amount'] = 'required|numeric|min:0';
            $rules['revenue_planned'] = 'required|numeric|min:0';
            $rules['urgency'] = 'required|in:Low,Medium,High';
            // Enforce that hierarchy fields are NOT set (they must be null)
            $rules['department_id'] = 'nullable';
            $rules['cost_center_id'] = 'nullable';
            $rules['sub_cost_center'] = 'nullable';
        }

        return $rules;
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $type = $this->input('type');

            // Skip hierarchical uniqueness validation for reallocations and VAT budgets
            if ($type !== 'reallocation' && $type !== 'vat') {
                $this->validateHierarchicalUniqueness($validator);
            }

            // Additional validation for VAT budgets:
            // - Enforce one active VAT budget per fiscal period (year) unless existing is Rejected
            if ($type === 'vat') {
                $fiscalPeriodId = $this->fiscal_period_id;

                if ($fiscalPeriodId) {
                    $existingVatBudget = \App\Models\RequestBudget::where('fiscal_period_id', $fiscalPeriodId)
                        ->where('type', 'vat')
                        ->whereIn('status', ['Draft', 'Pending', 'Approved'])
                        ->first();

                    if ($existingVatBudget) {
                        $validator->errors()->add(
                            'fiscal_period_id',
                            'A VAT budget already exists for this fiscal year and is not rejected. You can only create another VAT budget for this year if the existing one is rejected.'
                        );
                    }
                }
            }
        });
    }

    /**
     * Validate hierarchical uniqueness
     */
    private function validateHierarchicalUniqueness($validator)
    {
        Log::info('=== VALIDATING HIERARCHICAL UNIQUENESS ===');
        
        $fiscalPeriodId = $this->fiscal_period_id;
        $departmentId = $this->department_id;
        $costCenterId = $this->cost_center_id;
        $subCostCenter = $this->sub_cost_center;
        
        Log::info('Checking uniqueness for', [
            'fiscal_period_id' => $fiscalPeriodId,
            'department_id' => $departmentId,
            'cost_center_id' => $costCenterId,
            'sub_cost_center' => $subCostCenter
        ]);
        
        $query = \App\Models\RequestBudget::where('fiscal_period_id', $fiscalPeriodId)
            ->where('department_id', $departmentId)
            ->where('cost_center_id', $costCenterId);
        
        // Handle sub_cost_center - if null/empty, use whereNull, otherwise use where
        if (empty($subCostCenter)) {
            $query->whereNull('sub_cost_center');
            Log::info('Checking for existing request with NULL sub_cost_center');
        } else {
            $subCostCenterConverted = is_numeric($subCostCenter) ? (int)$subCostCenter : $subCostCenter;
            $query->where('sub_cost_center', $subCostCenterConverted);
            Log::info('Checking for existing request with sub_cost_center', ['sub_cost_center' => $subCostCenterConverted]);
        }
        
        $exists = $query->exists();
        Log::info('Uniqueness check result', ['exists' => $exists]);
        
        if ($exists) {
            $fiscalPeriod = \App\Models\FiscalPeriod::find($fiscalPeriodId);
            $department = \App\Models\Department::find($departmentId);
            $costCenter = \App\Models\CostCenter::find($costCenterId);
            
            $errorMessage = "Budget request already exists for Fiscal Year: {$fiscalPeriod->fiscal_year}, Department: {$department->name}, Cost Center: {$costCenter->name}";
            
            if (!empty($subCostCenter)) {
                $subCostCenterModel = \App\Models\CostCenter::find($subCostCenterConverted);
                $errorMessage .= ", Sub Cost Center: {$subCostCenterModel->name}";
            }
            
            Log::warning('Duplicate budget request detected', [
                'message' => $errorMessage,
                'fiscal_period_id' => $fiscalPeriodId,
                'department_id' => $departmentId,
                'cost_center_id' => $costCenterId,
                'sub_cost_center' => $subCostCenter
            ]);
            
            $validator->errors()->add('hierarchical_uniqueness', $errorMessage);
        } else {
            Log::info('No duplicate found - proceeding with creation');
        }
    }
}
