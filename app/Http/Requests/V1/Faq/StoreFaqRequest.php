<?php

namespace App\Http\Requests\V1\Faq;

use Illuminate\Foundation\Http\FormRequest;

class StoreFaqRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'question' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'screenshots' => ['nullable', 'array'],
            'screenshots.*' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
            'video_link' => ['nullable', 'string', 'url'],
        ];
    }
}
