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
        $grnId = $this->route('grn')?->id;

        return [
            'user_id' => 'sometimes|exists:users,id',
            'grn_number' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('grns', 'grn_number')->ignore($grnId)
            ],
            'quotation_id' => 'sometimes|exists:quotations,id',
            'purchase_order_id' => 'sometimes|exists:purchase_orders,id',
            'quantity' => 'sometimes|numeric|min:0',
            'delivery_date' => 'sometimes|date',
            'delivery_status' => [
                'sometimes',
                Rule::in(['complete_delivery', 'later_delivery', 'adjust_order'])
            ],
            'adjustment_notes' => 'sometimes|string|max:1000',
        ];
    }
}
