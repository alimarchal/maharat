<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
class StoreRfqRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'rfq_number' => ['required', 'string', 'unique:rfqs,rfq_number'],
            'requester_id' => ['required', 'exists:users,id'],
            'company_id' => ['required', 'exists:companies,id'],
            'warehouse_id' => ['required', 'exists:warehouses,id'],
            'organization_name' => ['required', 'string', 'max:255'],
            'organization_email' => ['required', 'email', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'contact_number' => ['required', 'string', 'max:255'],
            'request_type' => ['required', 'exists:statuses,id'],
            'payment_type' => ['required', 'exists:statuses,id'],
            'request_date' => ['required', 'date'],
            'expected_delivery_date' => ['required', 'date', 'after_or_equal:request_date'],
            'attachments' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
            'status_id' => ['required', 'exists:statuses,id'],

            // Items validation
            'items' => ['required', 'array', 'min:1'],
            'items.*.category_id' => ['required', 'exists:product_categories,id'],
            'items.*.item_name' => ['required', 'string', 'max:255'],
            'items.*.description' => ['nullable', 'string'],
            'items.*.unit_id' => ['required', 'exists:units,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.0001'],
            'items.*.brand' => ['nullable', 'string', 'max:255'],
            'items.*.model' => ['nullable', 'string', 'max:255'],
            'items.*.specifications' => ['nullable', 'string'],
            'items.*.attachment' => ['nullable', 'string'],
            'items.*.expected_delivery_date' => ['required', 'date', 'after_or_equal:request_date'],
            'items.*.status_id' => ['required', 'exists:statuses,id'],
        ];
    }
}
