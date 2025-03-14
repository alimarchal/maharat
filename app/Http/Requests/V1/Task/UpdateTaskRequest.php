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
            'assigned_at' => ['nullable', 'date'],
            'deadline' => ['nullable', 'date', 'after_or_equal:assigned_at'],
            'urgency' => ['sometimes', 'required', Rule::in(['Normal', 'Medium', 'High', 'Low', 'ASAP'])],
            'assigned_user_id' => ['sometimes', 'required', 'exists:users,id'],
            'read_status' => ['nullable', 'date'],
            'status' => ['sometimes', Rule::in(['Pending','Approved','Rejected','Referred'])],
        ];
    }
}
