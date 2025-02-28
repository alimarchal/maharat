<?php

namespace App\Http\Requests\V1\TaskDescription;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskDescriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'description' => ['sometimes', 'required', 'string'],
            'action' => ['sometimes', 'required', Rule::in(['Approve', 'Reject', 'Refer'])],
            'user_id' => ['nullable', 'exists:users,id'],
        ];
    }
}
