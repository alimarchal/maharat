<?php

namespace App\Http\Requests\V1\Invoice;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'invoice_number' => ['nullable', 'string'],
            'client_id' => ['nullable', 'exists:customers,id'],
            'status' => ['required', 'string', 'in:Draft,Pending,Paid,Overdue,Cancelled'],
            'payment_method' => ['nullable', 'string'],
            'representative_id' => ['nullable', 'string'],  
            'representative_email' => ['nullable', 'email'],  
            'representative_name' => ['nullable', 'string', 'max:255'],
            'issue_date' => ['nullable', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:issue_date'],
            'discounted_days' => ['nullable', 'integer', 'min:0'],  
            'vat_rate' => ['required', 'numeric', 'min:0'],
            'subtotal' => ['required', 'numeric', 'min:0'],
            'tax_amount' => ['required', 'numeric', 'min:0'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'], 
            'total_amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'notes' => ['nullable', 'string'], 
            'account_code_id' => ['nullable', 'exists:account_codes,id'],
            'items' => ['nullable', 'array'],
            'items.*.name' => ['required_with:items', 'string'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.quantity' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.unit_price' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.subtotal' => ['required_with:items', 'numeric', 'min:0'],
            'items.*.tax_rate' => ['nullable', 'numeric', 'min:0'],
            'items.*.tax_amount' => ['nullable', 'numeric', 'min:0'],
            'items.*.total' => ['required_with:items', 'numeric', 'min:0'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator)
    {
        $validator->after(function ($validator) {
            $invoiceNumber = $this->input('invoice_number');
            
            if ($invoiceNumber) {
                // Check if invoice number already exists among active records
                $exists = \App\Models\Invoice::where('invoice_number', $invoiceNumber)
                    ->whereNull('deleted_at')
                    ->exists();
                
                if ($exists) {
                    $validator->errors()->add('invoice_number', 'The invoice number has already been taken.');
                }
            }
        });
    }
}
