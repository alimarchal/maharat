<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UserManualStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'video' => 'nullable|file|mimes:mp4,webm,avi,mov|max:102400', // 100MB max
            'video_type' => 'nullable|string|max:50',
            'is_active' => 'boolean',
            'steps' => 'required|array|min:1',
            'steps.*.title' => 'required|string|max:255',
            'steps.*.description' => 'required|string',
            'steps.*.action_type' => 'nullable|string|max:50',
            'steps.*.details' => 'nullable|array',
            'steps.*.details.*' => 'string',
            'steps.*.screenshots' => 'nullable|array',
            'steps.*.screenshots.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
            'steps.*.actions' => 'nullable|array',
            'steps.*.actions.*.type' => 'required|string|max:50',
            'steps.*.actions.*.label' => 'required|string|max:255',
            'steps.*.actions.*.url' => 'nullable|string|max:255',
        ];
    }
}
