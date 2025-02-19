<?php

namespace App\Http\Requests\V1\QuotationDocument;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuotationDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'quotation_id' => 'required|exists:quotations,id',
            'document' => 'required|file|mimes:pdf,doc,docx|max:10240',
            'type' => 'required|string|in:quotation,terms_and_conditions'
        ];
    }
}
