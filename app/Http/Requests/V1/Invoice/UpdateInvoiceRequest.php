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
            'vendor_id' => ['sometimes', 'required', 'exists:customers,id'],
            'client_id' => ['sometimes', 'required', 'exists:customers,id'],
            'status' => ['sometimes', 'required', 'string', 'in:Draft,Pending,Paid,Overdue,Cancelled'],
            'payment_method' => ['nullable', 'string'],
            'issue_date' => ['sometimes', 'required', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:issue_date'],
            'discounted_days' => ['nullable', 'integer', 'min:0'],
            'currency' => ['sometimes', 'required', 'string', 'size:3'],
            'notes' => ['nullable', 'string'],

            // Invoice items
            'items' => ['sometimes', 'required', 'array', 'min:1'],
            'items.*.id' => ['sometimes', 'exists:invoice_items,id'],
            'items.*.name' => ['required', 'string'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['required', 'numeric', 'min:0'],
            'items.*.identification' => ['nullable', 'string'],
        ];
    }
}
