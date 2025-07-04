<?php

namespace App\Http\Requests\V1\PurchaseOrder;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePurchaseOrderRequest extends FormRequest
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
            'purchase_order_no' => [
                'sometimes',
                'required',
                'string',
                Rule::unique('purchase_orders')->ignore($this->purchaseOrder)
            ],
            'quotation_id' => 'nullable|exists:quotations,id',
            'rfq_id' => 'nullable|exists:rfqs,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'department_id' => 'nullable|exists:departments,id',
            'cost_center_id' => 'nullable|exists:cost_centers,id',
            'sub_cost_center_id' => 'nullable|exists:cost_centers,id',
            'supplier_id' => 'sometimes|required|exists:suppliers,id',
            'purchase_order_date' => 'sometimes|required|date',
            'amount' => 'sometimes|required|numeric|min:0',
            'vat_amount' => 'nullable|numeric|min:0',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:10240',
            'status' => 'sometimes|required|in:Approved,Draft,Rejected'
        ];
    }
}
