<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccountResource extends JsonResource
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
            'chart_of_account_id' => $this->chart_of_account_id,
            'account_code_id' => $this->account_code_id,
            'department_id' => $this->department_id,
            'name' => $this->name,
            'account_number' => $this->account_number,
            'description' => $this->description,
            'cost_center_id' => $this->cost_center_id,
            'status' => $this->status,
            'credit_amount' => $this->credit_amount,
            'debit_amount' => $this->debit_amount,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Include related resources when loaded
            'cost_center' => new CostCenterResource($this->whenLoaded('costCenter')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'updater' => new UserResource($this->whenLoaded('updater')),
            'chart_of_account' => new ChartOfAccountResource($this->whenLoaded('chartOfAccount')),
            'account_code' => new AccountCodeResource($this->whenLoaded('accountCode')),
        ];
    }
}
