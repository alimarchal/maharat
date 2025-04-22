<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UserManualUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|required|string|max:255',
            'video_url' => 'nullable|url|max:255',
            'video_type' => 'nullable|string|max:50',
            'is_active' => 'boolean',
        ];
    }
}
