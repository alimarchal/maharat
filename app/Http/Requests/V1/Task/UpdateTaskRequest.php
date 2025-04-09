<?php

namespace App\Http\Requests\V1\Task;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'process_step_id' => ['sometimes', 'required', 'exists:process_steps,id'],
            'process_id' => ['sometimes', 'required', 'exists:processes,id'],
            'order_no' => ['nullable','integer', 'min:1'],
            'material_request_id' => ['sometimes', 'exists:material_requests,id'],
            'rfq_id' => ['sometimes', 'exists:rfqs,id'],
            'purchase_order_id' => ['sometimes', 'exists:purchase_orders,id'],
            'payment_order_id' => ['sometimes', 'exists:payment_orders,id'],
            'invoice_id' => ['sometimes', 'exists:invoices,id'],
            'budget_id' => ['sometimes', 'exists:budgets,id'],
            'budget_approval_transaction_id' => ['sometimes', 'exists:budget_approval_transactions,id'],
            'request_budget_id' => ['sometimes', 'exists:request_budgets,id'],
            'assigned_at' => ['nullable', 'date'],
            'deadline' => ['nullable', 'date', 'after_or_equal:assigned_at'],
            'urgency' => ['sometimes', 'required', Rule::in(['Normal', 'Medium', 'High', 'Low', 'ASAP'])],
            'assigned_from_user_id' => ['sometimes', 'required', 'exists:users,id'],
            'assigned_to_user_id' => ['sometimes', 'required', 'exists:users,id'],
            'read_status' => ['nullable', 'date'],
            'status' => ['sometimes', Rule::in(['Pending','Approved','Rejected','Referred'])],
        ];
    }
}
