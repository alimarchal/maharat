<?php

namespace App\Http\Requests\V1\Quotation;

use Illuminate\Foundation\Http\FormRequest;

class UpdateQuotationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'supplier_id' => 'sometimes|required|exists:suppliers,id',
            'quotation_number' => 'sometimes|required|string|unique:quotations,quotation_number,' . $this->quotation->id,
            'issue_date' => 'sometimes|required|date',
            'valid_until' => 'sometimes|required|date|after:issue_date',
            'total_amount' => 'sometimes|required|numeric|min:0',
            'status_id' => 'sometimes|required|exists:statuses,id',
            'terms_and_conditions' => 'nullable|string',
            'notes' => 'nullable|string',
            'documents' => 'nullable|array',
            'documents.*' => 'file|mimes:pdf,doc,docx|max:10240'
        ];
    }
}
