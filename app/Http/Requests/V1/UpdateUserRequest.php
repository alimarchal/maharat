<?php

namespace App\Http\Requests\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;


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
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'firstname' => 'nullable|string|max:255',
            'lastname' => 'nullable|string|max:255',
            'designation_id' => 'nullable|integer|exists:designations,id',
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', Rule::unique('users')->ignore($this->user)],
            'password' => 'sometimes|required|string|min:8',
            'landline' => 'nullable|string|max:20',
            'mobile' => 'nullable|string|max:20',
            'is_salesman_linked' => 'nullable|string',
            'language' => 'nullable|string|max:10',
            'attachment' => 'nullable|file|image|max:10240', // 10MB max
        ];
    }
}
