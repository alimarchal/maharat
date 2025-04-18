<?php

namespace App\Http\Requests\V1\Inventory;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'warehouse_id' => ['sometimes', 'required', 'exists:warehouses,id'],
            'product_id' => ['sometimes', 'required', 'exists:products,id'],
            'quantity' => ['sometimes', 'required', 'numeric', 'min:0'],
            'reorder_level' => ['sometimes', 'required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
        ];
    }
}
