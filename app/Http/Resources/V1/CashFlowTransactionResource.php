<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CashFlowTransactionResource extends JsonResource
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
            'transaction_date' => $this->transaction_date->toDateTimeString(),
            'transaction_type' => $this->transaction_type,
            'chart_of_account_id' => $this->chart_of_account_id,
            'sub_cost_center_id' => $this->sub_cost_center_id,
            'account_id' => $this->account_id,
            'amount' => $this->amount,
            'balance_amount' => $this->balance_amount,
            'payment_method' => $this->payment_method,
            'reference_number' => $this->reference_number,
            'reference_type' => $this->reference_type,
            'description' => $this->description,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Include related resources when loaded
            'chart_of_account' => new ChartOfAccountResource($this->whenLoaded('chartOfAccount')),
            'sub_cost_center' => new CostCenterResource($this->whenLoaded('subCostCenter')),
            'account' => new AccountResource($this->whenLoaded('account')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'updater' => new UserResource($this->whenLoaded('updater')),
        ];
    }
}
