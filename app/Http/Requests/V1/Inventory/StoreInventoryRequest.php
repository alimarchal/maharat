<?php

namespace App\Http\Requests\V1\Inventory;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'product_id' => [
                'required',
                'exists:products,id',
                Rule::unique('inventories', 'product_id')
                    ->where('warehouse_id', $this->warehouse_id),
            ],
            'quantity' => ['required', 'numeric', 'min:0'],
            'reorder_level' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
        ];
    }
}
