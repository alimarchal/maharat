<?php

namespace App\Http\Resources\V1;

use App\Http\Resources\RequestBudgetResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseOrderResource extends JsonResource
{
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
            'vat_amount' => $this->vat_amount,
            'delivered_amount' => $this->delivered_amount,
            'pending_amount' => $this->pending_amount,
            'delivery_percentage' => $this->getDeliveryPercentage(),
            'attachment' => $this->attachment,
            'original_name' => $this->original_name,
            'generated_document' => $this->generated_document,
            'status' => $this->status,
            'has_good_receive_note' => $this->has_good_receive_note,
            'delivery_status' => $this->delivery_status,
            'delivery_status_label' => $this->getDeliveryStatusLabel(),
            'fiscal_period_id' => $this->fiscal_period_id,
            'request_budget_id' => $this->request_budget_id,
            'is_fully_delivered' => $this->isFullyDelivered(),
            'is_partially_delivered' => $this->isPartiallyDelivered(),
            'is_pending_delivery' => $this->isPendingDelivery(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Include related resources when loaded
            'rfq' => new RfqResource($this->whenLoaded('requestForQuotation')),
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'costCenter' => new CostCenterResource($this->whenLoaded('costCenter')),
            'subCostCenter' => new CostCenterResource($this->whenLoaded('subCostCenter')),
            'warehouse' => new WarehouseResource($this->whenLoaded('warehouse')),
            'quotation' => new QuotationResource($this->whenLoaded('quotation')),
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
            'created_by' => new UserResource($this->whenLoaded('user')),
            'requestBudget' => new RequestBudgetResource($this->whenLoaded('requestBudget')),
            'fiscalPeriod' => new FiscalPeriodResource($this->whenLoaded('fiscalPeriod')),
            'paymentOrders' => PaymentOrderResource::collection($this->whenLoaded('paymentOrders')),
            'goodReceiveNotes' => GrnResource::collection($this->whenLoaded('goodReceiveNote')),
            'adjustments' => PurchaseOrderAdjustmentResource::collection($this->whenLoaded('adjustments')),
        ];
    }

    /**
     * Calculate delivery percentage
     */
    protected function getDeliveryPercentage(): float
    {
        if ($this->amount == 0) {
            return 0;
        }
        return round(($this->delivered_amount / $this->amount) * 100, 2);
    }

    /**
     * Get human-readable delivery status label
     */
    protected function getDeliveryStatusLabel(): string
    {
        return match($this->delivery_status) {
            'pending' => 'Pending Delivery',
            'partially_delivered' => 'Partially Delivered',
            'delivered' => 'Delivered',
            'completed' => 'Completed',
            default => 'Unknown Status'
        };
    }
}