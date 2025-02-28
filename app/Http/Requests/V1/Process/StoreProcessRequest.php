<?php

namespace App\Http\Requests\V1\Process;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProcessRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Implement actual authorization logic as needed
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'status' => ['sometimes', 'string', Rule::in(['Active', 'Pending', 'Rejected', 'Expired','Draft'])],

            // Validate steps if they are provided with the process
            'steps' => ['sometimes', 'array'],
            'steps.*.user_id' => ['required', 'exists:users,id'],
            'steps.*.order' => ['required', 'integer', 'min:0'],
            'steps.*.name' => ['required', 'string', 'max:255'],
            'steps.*.description' => ['nullable', 'string'],
            'steps.*.conditions' => ['nullable', 'string'],
            'steps.*.status' => ['sometimes', 'string', Rule::in(['Pending', 'In Progress', 'Approved', 'Rejected', 'Skipped'])],
            'steps.*.required_fields' => ['nullable', 'json'],
            'steps.*.is_active' => ['sometimes', 'boolean'],
            'steps.*.timeout_days' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
