<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRfqItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rfq_id' => ['required', 'exists:rfqs,id'],
            'category_id' => ['required', 'exists:product_categories,id'],
            'item_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'unit_id' => ['required', 'exists:units,id'],
            'quantity' => ['required', 'numeric', 'min:0.0001'],
            'brand' => ['nullable', 'string', 'max:255'],
            'model' => ['nullable', 'string', 'max:255'],
            'specifications' => ['nullable', 'string'],
            'attachment' => ['nullable', 'string'],
            'expected_delivery_date' => ['required', 'date'],
            'quoted_price' => ['nullable', 'numeric', 'min:0'],
            'negotiated_price' => ['nullable', 'numeric', 'min:0'],
            'status_id' => ['required', 'exists:statuses,id'],
        ];
    }
}
