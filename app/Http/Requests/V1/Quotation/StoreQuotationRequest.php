<?php

namespace App\Http\Requests\V1\Quotation;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuotationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rfq_id' => 'required|exists:rfqs,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'quotation_number' => 'nullable|string|unique:quotations,quotation_number',
            'issue_date' => 'required|date',
            'valid_until' => 'required|date|after:issue_date',
            'total_amount' => 'required|numeric|min:0',
            'vat_amount' => 'nullable|numeric|min:0',
            'status_id' => 'required|exists:statuses,id',
            'terms_and_conditions' => 'nullable|string',
            'notes' => 'nullable|string',
            'documents' => 'nullable|array',
            'documents.*' => 'file|mimes:pdf,doc,docx|max:10240'
        ];
    }
}
