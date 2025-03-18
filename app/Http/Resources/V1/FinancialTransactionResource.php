<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FinancialTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'account_code_id' => $this->account_code_id,
            'chart_of_account_id' => $this->chart_of_account_id,
            'account_id' => $this->account_id,
            'department_id' => $this->department_id,
            'cost_center_id' => $this->cost_center_id,
            'sub_cost_center_id' => $this->sub_cost_center_id,
            'transaction_date' => $this->transaction_date?->format('Y-m-d'),
            'entry_type' => $this->entry_type,
            'status' => $this->status,
            'fiscal_period_id' => $this->fiscal_period_id,
            'reference_number' => $this->reference_number,
            'amount' => $this->amount,
            'description' => $this->description,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at?->format('Y-m-d H:i:s'),
            'posted_at' => $this->posted_at?->format('Y-m-d H:i:s'),
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),

            // Include relationships when loaded
            'account_code' => new AccountCodeResource($this->whenLoaded('accountCode')),
            'chart_of_account' => new ChartOfAccountResource($this->whenLoaded('chartOfAccount')),
            'account' => new AccountResource($this->whenLoaded('account')),
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'cost_center' => new CostCenterResource($this->whenLoaded('costCenter')),
            'sub_cost_center' => new CostCenterResource($this->whenLoaded('subCostCenter')),
            'fiscal_period' => new FiscalPeriodResource($this->whenLoaded('fiscalPeriod')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'updater' => new UserResource($this->whenLoaded('updater')),
            'approver' => new UserResource($this->whenLoaded('approver')),
        ];
    }
}
