<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;

class UpdateUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation()
    {
        Log::info("Raw update request data: ", $this->all());
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'firstname' => 'sometimes|nullable|string|max:255',
            'lastname' => 'sometimes|nullable|string|max:255',
            'username' => 'sometimes|nullable|string|max:255',
            'parent_id' => 'sometimes|nullable|integer|exists:users,id',
            'hierarchy_level' => 'sometimes|nullable|integer',
            'department_id' => 'sometimes|nullable|integer|exists:departments,id',
            'company_id' => 'sometimes|nullable|integer|exists:companies,id',
            'designation_id' => 'sometimes|nullable|integer|exists:designations,id',
            'branch_id' => 'sometimes|nullable|integer|exists:branches,id',
            'name' => 'sometimes|nullable|string|max:255',
            'employee_id' => ['sometimes', 'nullable', 'string', Rule::unique('users')->ignore($this->route('user'))],
            'email' => ['sometimes', 'nullable', 'email', Rule::unique('users')->ignore($this->route('user'))],
            'password' => 'sometimes|nullable|string|min:8',
            'landline' => 'sometimes|nullable|string|max:20',
            'mobile' => 'sometimes|nullable|string|max:20',
            'language' => 'sometimes|nullable|string|max:10',
            'profile_photo_path' => 'sometimes|nullable|file|image|max:10240',
            'employee_type' => 'sometimes|nullable|string',
            'description' => 'sometimes|nullable|string',
        ];
    }

    /**
     * Handle a passed validation attempt.
     */
    protected function passedValidation()
    {
        Log::info("Passed validation with data: ", $this->validated());
    }
}