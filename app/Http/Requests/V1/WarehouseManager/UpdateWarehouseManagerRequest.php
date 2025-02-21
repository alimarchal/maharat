<?php

namespace App\Http\Requests\V1\WarehouseManager;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWarehouseManagerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'warehouse_id' => ['sometimes', 'required', 'exists:warehouses,id'],
            'manager_id' => [
                'sometimes',
                'required',
                'exists:users,id',
                Rule::unique('warehouse_managers', 'manager_id')
                    ->ignore($this->warehouse_manager)
                    ->where('warehouse_id', $this->warehouse_id)
            ],
        ];
    }
}
