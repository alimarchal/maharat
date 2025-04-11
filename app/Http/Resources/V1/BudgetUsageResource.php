<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BudgetUsageResource extends JsonResource
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
            'sub_cost_center' => $this->sub_cost_center,
            'fiscal_period_id' => $this->fiscal_period_id,
            'sub_cost_center_approved_amount' => $this->sub_cost_center_approved_amount,
            'sub_cost_center_reserved_amount' => $this->sub_cost_center_reserved_amount,
            'sub_cost_center_consumed_amount' => $this->sub_cost_center_consumed_amount,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Include related resources when loaded
            'cost_center' => new CostCenterResource($this->whenLoaded('costCenter')),
            'fiscal_period' => new FiscalPeriodResource($this->whenLoaded('fiscalPeriod')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'updater' => new UserResource($this->whenLoaded('updater')),
        ];
    }
}
