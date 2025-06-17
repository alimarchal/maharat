<?php

namespace App\Http\Requests\V1\IssueMaterial;

use Illuminate\Foundation\Http\FormRequest;

class StoreIssueMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'material_request_id' => ['nullable', 'exists:material_requests,id'],
            'cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'sub_cost_center_id' => ['nullable', 'exists:cost_centers,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'priority' => ['required', 'string', 'in:High,Medium,Low'],
            'status' => ['required', 'string', 'in:Pending,Issue Material,Rejected'],
            'description' => ['nullable', 'string'],
        ];
    }
}
