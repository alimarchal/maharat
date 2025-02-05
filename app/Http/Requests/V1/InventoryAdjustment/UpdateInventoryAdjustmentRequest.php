<?php

namespace App\Http\Requests\V1\InventoryAdjustment;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInventoryAdjustmentRequest extends FormRequest
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
            'purchase_order_number' => ['nullable', 'string'],
            'quantity' => ['sometimes', 'required', 'numeric'],
            'reason' => ['sometimes', 'required', 'exists:statuses,id'],
            'description' => ['nullable', 'string'],
            'approved_by' => ['sometimes', 'required', 'exists:users,id'],
        ];
    }
}
