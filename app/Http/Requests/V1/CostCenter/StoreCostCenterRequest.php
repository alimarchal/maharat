<?php

namespace App\Http\Requests\V1\CostCenter;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCostCenterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'parent_id' => ['nullable', 'exists:cost_centers,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'code' => ['required', 'string', 'max:20', 'unique:cost_centers,code'],
            'name' => ['required', 'string', 'max:100'],
            'cost_center_type' => ['nullable', Rule::in(['Fixed', 'Variable', 'Support', 'Direct'])],
            'description' => ['nullable', 'string'],
            'status' => ['required', Rule::in(['Approved', 'Pending'])],
            'effective_start_date' => ['required', 'date'],
            'effective_end_date' => ['nullable', 'date', 'after:effective_start_date'],
            'manager_id' => ['nullable', 'exists:users,id'],
            'budget_owner_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
