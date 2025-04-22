<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ManualStepUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string',
            'action_type' => 'nullable|string|max:50',
            'details' => 'nullable|array',
            'details.*' => 'string',
            'screenshots' => 'nullable|array',
            'screenshots.*' => 'image|mimes:jpeg,png,jpg,gif|max:2048',
            'screenshot_alts' => 'nullable|array',
            'screenshot_alts.*' => 'nullable|string|max:255',
            'screenshot_captions' => 'nullable|array',
            'screenshot_captions.*' => 'nullable|string|max:255',
            'actions' => 'nullable|array',
            'actions.*.type' => 'required|string|max:50',
            'actions.*.label' => 'required|string|max:255',
            'actions.*.url' => 'nullable|string|max:255',
        ];
    }
}
