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
            'slug' => 'nullable|string|max:255',
            'video' => 'nullable|file|mimes:mp4,webm,avi,mov|max:102400', // 100MB max
            'video_path' => 'nullable|string|max:500',
            'video_type' => 'nullable|string|max:50',
            'is_active' => 'sometimes|boolean',
            'card_id' => 'nullable|integer|exists:cards,id',
            'parent_section' => 'nullable|integer',
            'subsection' => 'nullable|integer',
            'steps' => 'sometimes|array|min:1',
            'steps.*.title' => 'required|string|max:255',
            'steps.*.description' => 'required|string',
            'steps.*.action_type' => 'nullable|string|max:50',
            'steps.*.details' => 'nullable|array',
            'steps.*.details.*' => 'string',
            'steps.*.screenshots' => 'nullable|array',
            'steps.*.screenshots.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
            'steps.*.actions' => 'nullable|array',
            'steps.*.actions.*.type' => 'nullable|string|max:50',
            'steps.*.actions.*.action_type' => 'nullable|string|max:50',
            'steps.*.actions.*.label' => 'required|string|max:255',
            'steps.*.actions.*.url_or_action' => 'nullable|string|max:500',
            'steps.*.actions.*.style' => 'nullable|string|max:50',
        ];
    }
}
