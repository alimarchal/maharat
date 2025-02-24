<?php

namespace App\Http\Requests\V1\WarehouseManager;

use Illuminate\Foundation\Http\FormRequest;

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
            'type' => ['nullable'],
            'manager_id' => [
                'required',
                'exists:users,id',
                'unique:warehouse_managers,manager_id,NULL,id,warehouse_id,' . $this->warehouse_id
            ],
        ];
    }
}
