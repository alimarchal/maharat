<?php

namespace App\Http\Requests\V1\ExternalDeliveryNote;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExternalDeliveryNoteRequest extends FormRequest
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
            'user_id' => ['sometimes', 'nullable', 'exists:users,id'],
            'grn_id' => ['sometimes', 'nullable', 'exists:grns,id'],
            'purchase_order_id' => ['sometimes', 'nullable', 'exists:purchase_orders,id'],
            'delivery_note_number' => ['sometimes', 'nullable', 'string', 'max:255'],
            'attachment' => ['sometimes', 'nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:10240'], // 10MB max
            'attachment_name' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
