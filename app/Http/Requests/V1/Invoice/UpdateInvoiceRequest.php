<?php

namespace App\Http\Requests\V1\Invoice;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invoice_number' => ['nullable', 'string', 'unique:invoices,invoice_number,' . $this->route('invoice')],
            'client_id' => ['nullable', 'exists:customers,id'],
            'status' => ['sometimes', 'required', 'string', 'in:Draft,Pending,Paid,Overdue,Cancelled'],
            'payment_method' => ['nullable', 'string'],
            'representative_id' => ['nullable', 'string'],  
            'representative_email' => ['nullable', 'email'], 
            'issue_date' => ['sometimes', 'required', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:issue_date'],
            'discounted_days' => ['nullable', 'integer', 'min:0'], 
            'vat_rate' => ['sometimes', 'required', 'numeric', 'min:0'],
            'subtotal' => ['sometimes', 'required', 'numeric', 'min:0'],
            'tax_amount' => ['sometimes', 'required', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],  
            'total_amount' => ['sometimes', 'required', 'numeric', 'min:0'],
            'currency' => ['sometimes', 'required', 'string', 'size:3'],
            'notes' => ['nullable', 'string'],  
            'account_code_id' => ['nullable', 'exists:account_codes,id'],
        ];
    }
}
