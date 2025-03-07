<?php

namespace App\Http\Requests\V1\PaymentOrderLog;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePaymentOrderLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'description' => ['nullable', 'string'],
            'action' => ['nullable', 'string', 'in:Approved,Reject,Refer'],
            'priority' => ['nullable', 'string', 'in:Urgent,High,Standard,Low'],
        ];
    }
}
