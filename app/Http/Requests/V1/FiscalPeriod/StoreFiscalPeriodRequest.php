<?php

namespace App\Http\Requests\V1\FiscalPeriod;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFiscalPeriodRequest extends FormRequest
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
            'fiscal_year' => ['required', 'date'],
            'period_number' => [
                'required',
                'integer',
                'min:1',
                Rule::unique('fiscal_periods')
                    ->where(function ($query) {
                        return $query->whereDate('fiscal_year', $this->fiscal_year);
                    })
            ],
            'period_name' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'transaction_closed_upto' => ['nullable', 'date', 'before_or_equal:end_date'],
            'status' => ['required', Rule::in(['Open', 'Closed', 'Adjusting'])],
            'created_by' => ['nullable', 'exists:users,id'],
            'updated_by' => ['nullable', 'exists:users,id'],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation()
    {
        if (!$this->has('created_by')) {
            $this->merge(['created_by' => auth()->id()]);
        }
        if (!$this->has('updated_by')) {
            $this->merge(['updated_by' => auth()->id()]);
        }
    }
}
