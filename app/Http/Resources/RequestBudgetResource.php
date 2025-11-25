<?php

namespace App\Http\Resources;

use App\Http\Resources\V1\CostCenterResource;
use App\Http\Resources\V1\DepartmentResource;
use App\Http\Resources\V1\FiscalPeriodResource;
use App\Http\Resources\V1\UserResource;
use App\Http\Resources\V1\PurchaseOrderResource;
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
            'old_balance' => $this->old_balance,
            'reallocate_amount' => $this->reallocate_amount,
            'reallocate_to_sub_cost_center' => $this->reallocate_to_sub_cost_center,
            'destination_old_balance' => $this->destination_old_balance,
            'type' => $this->type ?? 'budget_request',
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
            'reallocate_to_sub_cost_center_details' => new CostCenterResource($this->whenLoaded('reallocateToSubCostCenter')),
            'original_destination_sub_cost_center_details' => new CostCenterResource($this->whenLoaded('originalDestinationSubCostCenter')),
            'updated_destination_sub_cost_center_details' => new CostCenterResource($this->whenLoaded('updatedDestinationSubCostCenter')),
            'updated_by_user' => new UserResource($this->whenLoaded('updatedByUser')),
            'purchase_order' => new PurchaseOrderResource($this->whenLoaded('purchaseOrder')),
            'source_budget_request' => $this->whenLoaded('sourceBudgetRequest', function () {
                if (!$this->sourceBudgetRequest) {
                    return null;
                }
                return [
                    'id' => $this->sourceBudgetRequest->id,
                    'balance_amount' => $this->sourceBudgetRequest->balance_amount,
                    'approved_amount' => $this->sourceBudgetRequest->approved_amount,
                ];
            }),
            'sub_cost_center_updated' => $this->sub_cost_center_updated,
            'original_destination_sub_cost_center' => $this->original_destination_sub_cost_center,
            'updated_destination_sub_cost_center' => $this->updated_destination_sub_cost_center,
            'updated_by_user_id' => $this->updated_by_user_id,
            'available_alternatives_json' => $this->available_alternatives_json,
            'reallocation_history' => $this->whenLoaded('reallocationHistory', function () {
                return [
                    'id' => $this->reallocationHistory->id,
                    'source_budget_request_id' => $this->reallocationHistory->source_budget_request_id,
                    'destination_budget_request_id' => $this->reallocationHistory->destination_budget_request_id,
                    'reallocate_amount' => $this->reallocationHistory->reallocate_amount,
                    'source_old_balance' => $this->reallocationHistory->source_old_balance,
                    'source_new_balance' => $this->reallocationHistory->source_new_balance,
                    'destination_old_balance' => $this->reallocationHistory->destination_old_balance,
                    'destination_new_balance' => $this->reallocationHistory->destination_new_balance,
                    'source_old_approved_amount' => $this->reallocationHistory->source_old_approved_amount,
                    'source_new_approved_amount' => $this->reallocationHistory->source_new_approved_amount,
                    'destination_old_approved_amount' => $this->reallocationHistory->destination_old_approved_amount,
                    'destination_new_approved_amount' => $this->reallocationHistory->destination_new_approved_amount,
                    'source_old_requested_amount' => $this->reallocationHistory->source_old_requested_amount,
                    'destination_old_requested_amount' => $this->reallocationHistory->destination_old_requested_amount,
                    'status' => $this->reallocationHistory->status,
                    'source_budget_request' => $this->reallocationHistory->sourceBudgetRequest ? [
                        'id' => $this->reallocationHistory->sourceBudgetRequest->id,
                        'approved_amount' => $this->reallocationHistory->sourceBudgetRequest->approved_amount,
                        'previous_year_budget_amount' => $this->reallocationHistory->sourceBudgetRequest->previous_year_budget_amount,
                        'requested_amount' => $this->reallocationHistory->sourceBudgetRequest->requested_amount,
                    ] : null,
                    'destination_budget_request' => $this->reallocationHistory->destinationBudgetRequest ? [
                        'id' => $this->reallocationHistory->destinationBudgetRequest->id,
                        'approved_amount' => $this->reallocationHistory->destinationBudgetRequest->approved_amount,
                        'requested_amount' => $this->reallocationHistory->destinationBudgetRequest->requested_amount,
                    ] : null,
                ];
            }),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'updater' => new UserResource($this->whenLoaded('updater')),
        ];
    }
}
