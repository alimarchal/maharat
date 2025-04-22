<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ManualStepReorderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => 'required|array',
            'items.*.id' => 'required|exists:manual_steps,id',
            'items.*.step_number' => 'required|integer|min:1',
        ];
    }
}
