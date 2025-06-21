<?php

namespace App\Http\Requests\V1\FiscalPeriod;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\FiscalPeriod;

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
            'fiscal_year_id' => ['sometimes', 'required', 'exists:fiscal_years,id'],
            'budget_name' => ['sometimes', 'required', 'string', 'max:255'],
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
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $this->validateUniqueDateCombination($validator);
        });
    }

    /**
     * Validate that the start_date and end_date combination is unique within the fiscal year.
     */
    private function validateUniqueDateCombination($validator)
    {
        $fiscalYearId = $this->fiscal_year_id ?? $this->fiscal_period->fiscal_year_id;
        $startDate = $this->start_date ?? $this->fiscal_period->start_date;
        $endDate = $this->end_date ?? $this->fiscal_period->end_date;

        $exists = FiscalPeriod::where('fiscal_year_id', $fiscalYearId)
            ->where('start_date', $startDate)
            ->where('end_date', $endDate)
            ->where('id', '!=', $this->fiscal_period->id)
            ->exists();

        if ($exists) {
            $validator->errors()->add('date_combination', 'A fiscal period with the same start date and end date already exists in this fiscal year.');
        }
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation()
    {
        $this->merge(['updated_by' => auth()->id()]);
    }
}
