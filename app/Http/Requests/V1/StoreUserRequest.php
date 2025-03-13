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
            'parent_id' => 'nullable|exists:users,id',
            'hierarchy_level' => 'nullable|integer',
            'designation_id' => 'required|exists:designations,id',
            'company_id' => 'nullable|exists:companies,id',
            'department_id' => 'required|exists:departments,id',
            'branch_id' => 'nullable|exists:branches,id',
            'employee_id' => 'required|string|unique:users,employee_id',
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'name' => 'required|string',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'landline' => 'nullable|string|max:10',
            'mobile' => 'required|string|regex:/^05\d{8}$/|unique:users',
            'is_salesman_linked' => 'nullable|string',
            'language' => 'nullable|string|max:10',
            'employee_type' => 'nullable|string',
            'description' => 'nullable|string',
            'profile_photo_path' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:10240', // 10MB max
        ];
    }
}
