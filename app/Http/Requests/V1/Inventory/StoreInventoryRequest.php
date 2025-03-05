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

    protected function prepareForValidation()
    {
        $this->merge([
            'user_id' => auth()->id(),
        ]);
    }

    public function rules(): array
    {
        return [
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'product_id' => [
                'required',
                'exists:products,id',
                Rule::unique('inventories')->where(function ($query) {
                    return $query->where('warehouse_id', $this->warehouse_id)
                        ->where('product_id', $this->product_id);
                }),
            ],
            'quantity' => ['required', 'numeric', 'min:0', 'decimal:0,4'],
            'reorder_level' => ['required', 'numeric', 'min:0', 'decimal:0,4'],
            'description' => ['nullable', 'string'],
            'transaction_type' => ['required', 'string'],
            'previous_quantity' => ['nullable', 'string'],
            'new_quantity' => ['nullable', 'string'],
            'reference_number' => ['nullable', 'string'],
            'reference_type' => ['nullable', 'string'],
            'reference_id' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'user_id' => ['sometimes'],
        ];
    }
}
