<?php

namespace App\Http\Requests\V1\InventoryAdjustment;

use Illuminate\Foundation\Http\FormRequest;

class StoreInventoryAdjustmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'product_id' => ['required', 'exists:products,id'],
            'purchase_order_number' => ['nullable', 'string'],
            'quantity' => ['required', 'numeric'],
            'reason' => ['required', 'exists:statuses,id'],
            'description' => ['nullable', 'string'],
            'approved_by' => ['required', 'exists:users,id'],
        ];
    }
}
