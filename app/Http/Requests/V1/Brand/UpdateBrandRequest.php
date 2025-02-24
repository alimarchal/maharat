<?php

namespace App\Http\Requests\V1\Brand;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBrandRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('brands', 'code')->ignore($this->brand)
            ],
            'description' => 'nullable|string',
            'website' => 'nullable|url|max:255',
            'status_id' => 'nullable|exists:statuses,id'
        ];
    }
}
