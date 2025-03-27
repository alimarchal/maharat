<?php

namespace App\Http\Requests\V1\Asset;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAssetRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Adjust based on your authorization logic
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'asset_code' => [
                'sometimes',
                'string',
                Rule::unique('assets', 'asset_code')->ignore($this->asset)
            ],
            'type' => ['sometimes', 'string', 'in:fixed,current,intangible'],
            'status' => ['sometimes', 'string', 'in:active,disposed,written_off,sold'],
            'acquisition_cost' => ['sometimes', 'numeric', 'min:0'],
            'current_value' => ['sometimes', 'numeric', 'min:0'],
            'salvage_value' => ['nullable', 'numeric', 'min:0'],
            'acquisition_date' => ['sometimes', 'date'],
            'disposal_date' => ['nullable', 'date', 'after_or_equal:acquisition_date'],
            'useful_life_years' => ['nullable', 'integer', 'min:1'],
            'depreciation_method' => ['nullable', 'string', 'in:straight_line,declining_balance,units_of_production,none'],
            'description' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'is_leased' => ['nullable', 'boolean'],
            'lease_expiry_date' => ['nullable', 'date', 'after_or_equal:acquisition_date'],
        ];
    }
}
