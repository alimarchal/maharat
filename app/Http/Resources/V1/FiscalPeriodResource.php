<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FiscalPeriodResource extends JsonResource
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
            'fiscal_year_id' => (int) $this->fiscal_year_id,
            'fiscal_year' => $this->fiscalYear?->fiscal_year,
            'budget_name' => $this->budget_name,
            'period_name' => $this->period_name,
            'start_date' => $this->start_date->format('Y-m-d'),
            'end_date' => $this->end_date->format('Y-m-d'),
            'transaction_closed_upto' => $this->transaction_closed_upto?->format('Y-m-d'),
            'status' => $this->status,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,
            'budgets_count' => (int) ($this->request_budgets_count ?? 0),

            // Include related resources when loaded
            'fiscal_year_data' => new FiscalYearResource($this->whenLoaded('fiscalYear')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'updater' => new UserResource($this->whenLoaded('updater')),
        ];
    }
}
