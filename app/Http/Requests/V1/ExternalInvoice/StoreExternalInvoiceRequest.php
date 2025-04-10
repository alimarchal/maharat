<?php

namespace App\Http\Requests\V1\ExternalInvoice;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreExternalInvoiceRequest extends FormRequest
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
            'purchase_order_id' => ['nullable', 'exists:purchase_orders,id'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'invoice_id' => ['required', 'string', 'unique:external_invoices,invoice_id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'status' => ['required', Rule::in(['Draft', 'Verified', 'Paid', 'UnPaid', 'Partially Paid'])],
            'type' => ['required', Rule::in(['Cash', 'Credit'])],
            'payable_date' => ['required', 'date'],
        ];
    }
}
