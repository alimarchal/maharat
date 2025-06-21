<?php

namespace App\Http\Resources\V1;

use App\Http\Resources\RequestBudgetResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BudgetResource extends JsonResource
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
            'sub_cost_center_id' => $this->sub_cost_center_id,
            'description' => $this->description,
            'total_revenue_planned' => $this->total_revenue_planned,
            'total_revenue_actual' => $this->total_revenue_actual,
            'total_expense_planned' => $this->total_expense_planned,
            'total_expense_actual' => $this->total_expense_actual,
            'status' => $this->status,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Include related resources when loaded
            'fiscal_period' => new FiscalPeriodResource($this->whenLoaded('fiscalPeriod')),
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'cost_center' => new CostCenterResource($this->whenLoaded('costCenter')),
            'sub_cost_center' => new CostCenterResource($this->whenLoaded('subCostCenter')),
            'request_budget' => new RequestBudgetResource($this->whenLoaded('requestBudget')),
            'budget_approval_transactions' => BudgetApprovalTransactionResource::collection($this->whenLoaded('budgetApprovalTransactions')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'updater' => new UserResource($this->whenLoaded('updater')),
        ];
    }
}
