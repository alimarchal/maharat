<?php

namespace App\Http\Requests\V1\Grn;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateGrnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['sometimes', 'nullable', 'exists:users,id'],
            'grn_number' => [
                'sometimes',
                'required',
                'string',
                Rule::unique('grns')->ignore($this->grn)
            ],
            'quotation_id' => ['sometimes', 'nullable', 'exists:quotations,id'],
            'purchase_order_id' => ['sometimes', 'nullable', 'exists:purchase_orders,id'],
            'quantity' => ['sometimes', 'required', 'numeric', 'min:0'],
            'delivery_date' => ['sometimes', 'required', 'date'],
        ];
    }
}
