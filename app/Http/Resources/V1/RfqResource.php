<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RfqResource extends JsonResource
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
            'rfq_number' => $this->rfq_number,
            'warehouse_id' => $this->warehouse_id,
            'department_id' => $this->department_id,
            'cost_center_id' => $this->cost_center_id,
            'sub_cost_center_id' => $this->sub_cost_center_id,
            'organization_name' => $this->organization_name,
            'organization_email' => $this->organization_email,
            'city' => $this->city,
            'contact_number' => $this->contact_number,
            'request_date' => $this->request_date,
            'expected_delivery_date' => $this->expected_delivery_date,
            'closing_date' => $this->closing_date,
            'attachments' => $this->attachments,
            'notes' => $this->notes,
            'quotation_sent' => $this->quotation_sent,
            'quotation_sent_at' => $this->quotation_sent_at,
            'quotation_document' => $this->quotation_document,
            'excel_attachment' => $this->excel_attachment,
            'status_id' => $this->status_id,

            // Relationships
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'costCenter' => new CostCenterResource($this->whenLoaded('costCenter')),
            'subCostCenter' => $this->whenLoaded('subCostCenter', function () {
                return $this->subCostCenter ? new CostCenterResource($this->subCostCenter) : null;
            }),
            'requester' => new UserResource($this->whenLoaded('requester')),
            'company' => new CompanyResource($this->whenLoaded('company')),
            'warehouse' => new WarehouseResource($this->whenLoaded('warehouse')),
            'categories' => ProductCategoryResource::collection($this->whenLoaded('categories')),
            'status' => new StatusResource($this->whenLoaded('status')),
            'request_type' => new StatusResource($this->whenLoaded('requestType')),
            'payment_type' => new StatusResource($this->whenLoaded('paymentType')),
            'items' => RfqItemResource::collection($this->whenLoaded('items')),
            'status_logs' => RfqStatusLogResource::collection($this->whenLoaded('statusLogs')),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
