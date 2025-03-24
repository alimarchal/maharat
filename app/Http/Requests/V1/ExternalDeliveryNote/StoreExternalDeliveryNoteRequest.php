<?php

namespace App\Http\Requests\V1\ExternalDeliveryNote;

use Illuminate\Foundation\Http\FormRequest;

class StoreExternalDeliveryNoteRequest extends FormRequest
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
            'user_id' => ['nullable', 'exists:users,id'],
            'grn_id' => ['nullable', 'exists:grns,id'],
            'purchase_order_id' => ['nullable', 'exists:purchase_orders,id'], // Now optional since it will be auto-populated
            'delivery_note_number' => ['nullable', 'string', 'max:255'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:10240'], // 10MB max
        ];
    }
}
