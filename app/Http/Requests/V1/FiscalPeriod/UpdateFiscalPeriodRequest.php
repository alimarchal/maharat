<?php

namespace App\Http\Requests\V1\FiscalPeriod;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFiscalPeriodRequest extends FormRequest
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
            'fiscal_year' => ['sometimes', 'required', 'date'],
            'period_number' => [
                'sometimes',
                'required',
                'integer',
                'min:1',
                Rule::unique('fiscal_periods')
                    ->where(function ($query) {
                        return $query->whereDate(
                            'fiscal_year',
                            $this->fiscal_year ?? $this->fiscal_period->fiscal_year
                        );
                    })
                    ->ignore($this->fiscal_period)
            ],
            'period_name' => ['sometimes', 'required', 'string', 'max:255'],
            'start_date' => ['sometimes', 'required', 'date'],
            'end_date' => [
                'sometimes',
                'required',
                'date',
                'after_or_equal:' . ($this->start_date ?? $this->fiscal_period->start_date)
            ],
            'transaction_closed_upto' => [
                'nullable',
                'date',
                'before_or_equal:' . ($this->end_date ?? $this->fiscal_period->end_date)
            ],
            'status' => ['sometimes', 'required', Rule::in(['Open', 'Closed', 'Adjusting'])],
            'updated_by' => ['nullable', 'exists:users,id'],
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation()
    {
        $this->merge(['updated_by' => auth()->id()]);
    }
}
