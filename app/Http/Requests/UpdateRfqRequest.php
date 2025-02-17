<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRfqRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'organization_name' => ['sometimes', 'required', 'string', 'max:255'],
            'organization_email' => ['sometimes', 'required', 'email', 'max:255'],
            'city' => ['sometimes', 'required', 'string', 'max:255'],
            'contact_number' => ['sometimes', 'required', 'string', 'max:255'],
            'request_type' => ['sometimes', 'required', 'exists:statuses,id'],
            'payment_type' => ['sometimes', 'required', 'exists:statuses,id'],
            'request_date' => ['sometimes', 'required', 'date'],
            'expected_delivery_date' => ['sometimes', 'required', 'date', 'after_or_equal:request_date'],
            'attachments' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'status_id' => ['sometimes', 'required', 'exists:statuses,id'],
            'remarks' => ['required_with:status_id', 'string'], // Required when changing status
        ];
    }
}
