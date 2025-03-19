<?php

namespace App\Http\Requests\V1\PurchaseOrder;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseOrderRequest extends FormRequest
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
            'purchase_order_no' => 'nullable',
            'quotation_id' => 'nullable|exists:quotations,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'department_id' => 'nullable|exists:departments,id',
            'cost_center_id' => 'nullable|exists:cost_centers,id',
            'sub_cost_center_id' => 'nullable|exists:cost_centers,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'purchase_order_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
            'attachment' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:4096',
            'status' => 'required|in:Approved,Draft,Rejected'
        ];
    }
}
