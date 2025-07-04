<?php

namespace App\Http\Requests\V1\Rfq;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRfqRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'category_ids' => ['sometimes', 'array'],
            'category_ids.*' => ['exists:product_categories,id'],
            'items' => ['sometimes', 'array'],
            'items.*.id' => ['sometimes', 'exists:rfq_items,id'],
            'items.*.category_id' => ['required', 'exists:product_categories,id'],
        ];
    }
}
