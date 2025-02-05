<?php

namespace App\Http\Requests\V1\InventoryTransfer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInventoryTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from_warehouse_id' => [
                'sometimes',
                'required',
                'exists:warehouses,id',
                Rule::notIn([$this->to_warehouse_id])
            ],
            'to_warehouse_id' => [
                'sometimes',
                'required',
                'exists:warehouses,id',
                Rule::notIn([$this->from_warehouse_id])
            ],
            'product_id' => ['sometimes', 'required', 'exists:products,id'],
            'quantity' => ['sometimes', 'required', 'numeric', 'min:0.0001'],
            'reason' => ['sometimes', 'required', 'exists:statuses,id'],
            'tracking_number' => ['nullable', 'string'],
            'transfer_date' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'from_warehouse_id.not_in' => 'Source and destination warehouses must be different.',
            'to_warehouse_id.not_in' => 'Source and destination warehouses must be different.',
        ];
    }
}
