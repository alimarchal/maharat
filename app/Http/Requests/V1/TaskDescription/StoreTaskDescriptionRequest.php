<?php

namespace App\Http\Requests\V1\TaskDescription;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTaskDescriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'task_id' => ['required', 'exists:tasks,id'],
            'description' => ['required', 'string'],
            'action' => ['required', Rule::in(['Approve', 'Reject', 'Refer'])],
            'user_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
