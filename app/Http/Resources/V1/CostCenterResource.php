<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CostCenterResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'department_id' => $this->department_id,
            'code' => $this->code,
            'name' => $this->name,
            'cost_center_type' => $this->cost_center_type,
            'description' => $this->description,
            'status' => $this->status,
            'effective_start_date' => $this->effective_start_date?->toDateString(),
            'effective_end_date' => $this->effective_end_date?->toDateString(),
            'manager_id' => $this->manager_id,
            'budget_owner_id' => $this->budget_owner_id,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,

            // Budget calculations
            'total_expenses' => $this->calculateTotalExpenses(),
            'total_balance' => $this->calculateTotalBalance(),

            // Include related resources when loaded
            'parent' => new CostCenterResource($this->whenLoaded('parent')),
            'children' => CostCenterResource::collection($this->whenLoaded('children')),
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'manager' => new UserResource($this->whenLoaded('manager')),
            'budget_owner' => new UserResource($this->whenLoaded('budgetOwner')),
            'created_by_user' => new UserResource($this->whenLoaded('createdBy')),
            'updated_by_user' => new UserResource($this->whenLoaded('updatedBy')),
        ];
    }

    /**
     * Calculate total expenses for this cost center
     */
    private function calculateTotalExpenses()
    {
        if ($this->parent_id === null) {
            // Main cost center: sum all sub cost centers' expenses
            $subCostCenterIds = $this->children->pluck('id')->toArray();
            
            if (empty($subCostCenterIds)) {
                return 0;
            }

            return \App\Models\RequestBudget::whereIn('sub_cost_center', $subCostCenterIds)
                ->where('status', 'Approved')
                ->sum('consumed_amount') ?? 0;
        } else {
            // Sub cost center: get direct expenses
            return \App\Models\RequestBudget::where('sub_cost_center', $this->id)
                ->where('status', 'Approved')
                ->sum('consumed_amount') ?? 0;
        }
    }

    /**
     * Calculate total balance for this cost center
     */
    private function calculateTotalBalance()
    {
        if ($this->parent_id === null) {
            // Main cost center: sum all sub cost centers' balances
            $subCostCenterIds = $this->children->pluck('id')->toArray();
            
            if (empty($subCostCenterIds)) {
                return 0;
            }

            return \App\Models\RequestBudget::whereIn('sub_cost_center', $subCostCenterIds)
                ->where('status', 'Approved')
                ->sum('balance_amount') ?? 0;
        } else {
            // Sub cost center: get direct balance
            return \App\Models\RequestBudget::where('sub_cost_center', $this->id)
                ->where('status', 'Approved')
                ->sum('balance_amount') ?? 0;
        }
    }
}
