<?php

namespace App\Http\Requests\V1\ProcessStep;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProcessStepRequest extends FormRequest
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
            'process_id' => ['required', 'exists:processes,id'],
            'approver_id' => ['nullable', 'exists:users,id'],
            'designation_id' => ['nullable', 'exists:process_step_designations,id'],
            'order' => ['required', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'timeout_days' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
