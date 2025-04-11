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
            'role_id' => 'required|integer|exists:roles,id',
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
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'landline' => 'nullable|string|max:10',
            'gender' => 'nullable|in:Male,Female',
            'mobile' => 'required|string|regex:/^05\d{8}$/|unique:users',
            'is_salesman_linked' => 'nullable|string',
            'language' => 'nullable|string|max:10',
            'employee_type' => 'nullable|string',
            'description' => 'nullable|string',
            'profile_photo_path' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:10240', // 10MB max
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'first_name' => 'first name',
            'last_name' => 'last name',
        ];
    }

    /**
     * Prepare the data for validation.
     *
     * @return void
     */
    protected function prepareForValidation()
    {
        // If firstname/lastname are provided but first_name/last_name are not,
        // copy the values to maintain compatibility
        $this->merge([
            'first_name' => $this->first_name ?? $this->firstname ?? null,
            'last_name' => $this->last_name ?? $this->lastname ?? null,
        ]);
    }

    /**
     * Get the validated data from the request.
     * This method maps validation field names to database column names
     *
     * @return array
     */
    public function validated($key = null, $default = null)
    {
        $validated = parent::validated($key, $default);

        // Map first_name to firstname and last_name to lastname
        if (isset($validated['first_name'])) {
            $validated['firstname'] = $validated['first_name'];
        }

        if (isset($validated['last_name'])) {
            $validated['lastname'] = $validated['last_name'];
        }

        return $validated;
    }
}
