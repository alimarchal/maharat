<?php

namespace App\Http\Requests\V1\Task;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'process_step_id' => ['required', 'exists:process_steps,id'],
            'process_id' => ['required', 'exists:processes,id'],
            'order_no' => ['nullable','integer', 'min:1'],
            'material_request_id' => ['sometimes', 'exists:material_requests,id'],
            'rfq_id' => ['sometimes', 'exists:rfqs,id'],
            'purchase_order_id' => ['sometimes', 'exists:purchase_orders,id'],
            'payment_order_id' => ['sometimes', 'exists:payment_orders,id'],
            'invoice_id' => ['sometimes', 'exists:invoices,id'],
            'assigned_at' => ['nullable', 'date'],
            'deadline' => ['nullable', 'date', 'after_or_equal:assigned_at'],
            'urgency' => ['required', Rule::in(['Normal', 'Medium', 'High', 'Low', 'ASAP'])],
            'status' => ['sometimes', Rule::in(['Pending','Approved','Rejected','Referred'])],
            'assigned_from_user_id' => ['required', 'exists:users,id'],
            'assigned_to_user_id' => ['required', 'exists:users,id'],
            'read_status' => ['nullable', 'date'],
            'descriptions' => ['nullable', 'array'],
            'descriptions.*.description' => ['required', 'string'],
            'descriptions.*.action' => ['required', Rule::in(['Approve', 'Reject', 'Refer'])],
            'descriptions.*.user_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
