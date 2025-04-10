<?php

namespace App\Http\Requests\V1\ExternalInvoice;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExternalInvoiceRequest extends FormRequest
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
            'purchase_order_id' => ['sometimes', 'nullable', 'exists:purchase_orders,id'],
            'supplier_id' => ['sometimes', 'required', 'exists:suppliers,id'],
            'invoice_id' => [
                'sometimes',
                'required',
                'string',
                Rule::unique('external_invoices', 'invoice_id')->ignore($this->external_invoice)
            ],
            'amount' => ['sometimes', 'required', 'numeric', 'min:0'],
            'status' => ['sometimes', 'required', Rule::in(['Draft', 'Verified', 'Paid', 'UnPaid', 'Partially Paid'])],
            'type' => ['sometimes', 'required', Rule::in(['Cash', 'Credit'])],
            'payable_date' => ['sometimes', 'required', 'date'],
        ];
    }
}
