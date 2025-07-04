<?php

namespace App\Http\Requests\V1\MaterialRequest;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMaterialRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'requester_id' => ['sometimes', 'required', 'exists:users,id'],
            'warehouse_id' => ['sometimes', 'required', 'exists:warehouses,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'sub_cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'expected_delivery_date' => ['sometimes', 'required', 'date', 'after_or_equal:today'],
            'status_id' => ['sometimes', 'required', 'exists:statuses,id'],
        ];
    }
}
