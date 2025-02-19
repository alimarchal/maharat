<?php

namespace App\Http\Requests\V1\QuotationDocument;

use Illuminate\Foundation\Http\FormRequest;

class UpdateQuotationDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'document' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
            'type' => 'sometimes|required|string|in:quotation,terms_and_conditions'
        ];
    }
}
