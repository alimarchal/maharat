<?php

namespace App\Http\Resources\V1;

use App\Http\Resources\RequestBudgetResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\V1\PaymentOrderResource;
use App\Http\Resources\V1\GrnResource;

class PurchaseOrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'purchase_order_no' => $this->purchase_order_no,
            'quotation_id' => $this->quotation_id,
            'supplier_id' => $this->supplier_id,
            'user_id' => $this->user_id,
            'rfq_id' => $this->rfq_id,
            'cost_center_id' => $this->cost_center_id,
            'sub_cost_center_id' => $this->sub_cost_center_id,
            'purchase_order_date' => $this->purchase_order_date ? $this->purchase_order_date->toDateString() : null,
            'expiry_date' => $this->expiry_date ? $this->expiry_date->toDateString() : null,
            'amount' => $this->amount,
            'attachment' => $this->attachment,
            'original_name' => $this->original_name,
            'generated_document' => $this->generated_document,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

//            // Include related resources when loaded
            'rfq' => new RfqResource($this->whenLoaded('requestForQuotation')),
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'costCenter' => new CostCenterResource($this->whenLoaded('costCenter')),
            'subCostCenter' => new CostCenterResource($this->whenLoaded('subCostCenter')),
            'warehouse' => new WarehouseResource($this->whenLoaded('warehouse')),
            'quotation' => new QuotationResource($this->whenLoaded('quotation')),
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
            'created_by' => new UserResource($this->whenLoaded('user')),
            'requestBudget' => new RequestBudgetResource($this->whenLoaded('requestBudget')),
            'paymentOrders' => PaymentOrderResource::collection($this->whenLoaded('paymentOrders')),
            'goodReceiveNotes' => GrnResource::collection($this->whenLoaded('goodReceiveNote')),
        ];
    }
}
