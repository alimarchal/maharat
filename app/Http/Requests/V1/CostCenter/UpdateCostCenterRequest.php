<?php

namespace App\Http\Requests\V1\CostCenter;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCostCenterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'parent_id' => ['sometimes', 'nullable', 'exists:cost_centers,id'],
            'department_id' => ['sometimes', 'nullable', 'exists:departments,id'],
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:20',
                Rule::unique('cost_centers')->ignore($this->cost_center),
            ],
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'cost_center_type' => ['sometimes', 'nullable', Rule::in(['Fixed', 'Variable', 'Support', 'Direct'])],
            'description' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', 'required', Rule::in(['Approved', 'Pending'])],
            'effective_start_date' => ['sometimes', 'required', 'date'],
            'effective_end_date' => ['sometimes', 'nullable', 'date', 'after:effective_start_date'],
            'manager_id' => ['sometimes', 'nullable', 'exists:users,id'],
            'budget_owner_id' => ['sometimes', 'nullable', 'exists:users,id'],
        ];
    }
}
