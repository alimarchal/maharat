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
            'client_id' => ['nullable', 'integer', 'exists:customers,id'],
            'status' => ['required', 'string', 'in:Draft,Pending,Paid,Overdue,Cancelled'],
            'issue_date' => ['required', 'date'],
            'currency' => ['required', 'string', 'size:3'],
            'total_amount' => ['required', 'numeric', 'min:0'],
            'subtotal' => ['required', 'numeric', 'min:0'],
            'tax_amount' => ['required', 'numeric', 'min:0'],
            'account_code_id' => ['required', 'exists:account_codes,id'],

            // Optional fields
            'payment_method' => ['nullable', 'string'],
            'due_date' => ['nullable', 'date', 'after_or_equal:issue_date'],
            'discounted_days' => ['nullable', 'integer', 'min:0'],
            'notes' => ['nullable', 'string']
        ];
    }
}
