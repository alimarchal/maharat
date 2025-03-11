<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'parent_id' => 'nullable|integer|exists:users,id',
            'hierarchy_level' => 'nullable|integer',
            'department_id' => 'nullable|integer|exists:departments,id',
            'company_id' => 'nullable|integer|exists:companies,id',
            'designation_id' => 'nullable|integer|exists:designations,id',
            'branch_id' => 'nullable|integer|exists:branches,id',
            'firstname' => 'nullable|string|max:255',
            'lastname' => 'nullable|string|max:255',
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users,email',
            'password' => 'required|string|min:8',
            'landline' => 'nullable|string|max:20',
            'mobile' => 'nullable|string|max:20',
            'is_salesman_linked' => 'nullable|string',
            'language' => 'nullable|string|max:10',
            'attachment' => 'nullable|file|image|max:10240', // 10MB max
        ];
    }
}
