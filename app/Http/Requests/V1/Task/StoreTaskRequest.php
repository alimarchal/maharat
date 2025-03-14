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
            'assigned_at' => ['nullable', 'date'],
            'deadline' => ['nullable', 'date', 'after_or_equal:assigned_at'],
            'urgency' => ['required', Rule::in(['Normal', 'Medium', 'High', 'Low', 'ASAP'])],
            'status' => ['sometimes', Rule::in(['Pending','Approved','Rejected','Referred'])],
            'assigned_user_id' => ['required', 'exists:users,id'],
            'read_status' => ['nullable', 'date'],
            'descriptions' => ['nullable', 'array'],
            'descriptions.*.description' => ['required', 'string'],
            'descriptions.*.action' => ['required', Rule::in(['Approve', 'Reject', 'Refer'])],
            'descriptions.*.user_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
