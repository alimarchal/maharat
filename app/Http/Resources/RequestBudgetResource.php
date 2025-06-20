<?php

namespace App\Http\Resources;

use App\Http\Resources\V1\CostCenterResource;
use App\Http\Resources\V1\DepartmentResource;
use App\Http\Resources\V1\FiscalPeriodResource;
use App\Http\Resources\V1\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RequestBudgetResource extends JsonResource
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
            'fiscal_period_id' => $this->fiscal_period_id,
            'department_id' => $this->department_id,
            'cost_center_id' => $this->cost_center_id,
            'sub_cost_center' => $this->sub_cost_center,
            'previous_year_revenue' => $this->previous_year_revenue,
            'current_year_revenue' => $this->current_year_revenue,
            'previous_year_budget_amount' => $this->previous_year_budget_amount,
            'requested_amount' => $this->requested_amount,
            'revenue_planned' => $this->revenue_planned,
            'approved_amount' => $this->approved_amount,
            'reserved_amount' => $this->reserved_amount,
            'consumed_amount' => $this->consumed_amount,
            'balance_amount' => $this->balance_amount,
            'urgency' => $this->urgency,
            'attachment_path' => $this->attachment_path,
            'original_name' => $this->original_name,
            'reason_for_increase' => $this->reason_for_increase,
            'status' => $this->status,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,

            // Related resources
            'fiscal_period' => new FiscalPeriodResource($this->whenLoaded('fiscalPeriod')),
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'cost_center' => new CostCenterResource($this->whenLoaded('costCenter')),
            'sub_cost_center_details' => new CostCenterResource($this->whenLoaded('subCostCenter')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'updater' => new UserResource($this->whenLoaded('updater')),
        ];
    }
}
