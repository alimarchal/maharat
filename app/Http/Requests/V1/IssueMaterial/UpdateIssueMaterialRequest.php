<?php

namespace App\Http\Requests\V1\IssueMaterial;

use Illuminate\Foundation\Http\FormRequest;

class UpdateIssueMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'material_request_id' => ['sometimes', 'nullable', 'exists:material_requests,id'],
            'cost_center_id' => ['sometimes', 'nullable', 'exists:cost_centers,id'],
            'sub_cost_center_id' => ['sometimes', 'nullable', 'exists:cost_centers,id'],
            'department_id' => ['sometimes', 'nullable', 'exists:departments,id'],
            'priority' => ['sometimes', 'required', 'string', 'in:High,Medium,Low'],
            'status' => ['sometimes', 'required', 'string', 'in:Pending,Issue Material'],
            'description' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
