<?php

namespace App\Http\Requests\V1\WarehouseManager;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWarehouseManagerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'type' => ['required', 'string', 'in:Manager,Assistant'],
            'manager_id' => [
                'required',
                'exists:users,id',
                Rule::unique('warehouse_managers')->where(function ($query) {
                    return $query->where('type', $this->type)
                               ->where('warehouse_id', '!=', $this->warehouse_id);
                })
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'manager_id.unique' => 'This manager is already assigned to another warehouse as a ' . strtolower($this->type),
        ];
    }
}
