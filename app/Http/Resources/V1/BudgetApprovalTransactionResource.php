<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BudgetApprovalTransactionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Get referee's transaction status if this transaction has a referred_to user
        $refereeStatus = null;
        if ($this->referred_to) {
            // Get the referee's status from the task that was created for the referee
            $refereeTask = \App\Models\Task::where('budget_id', $this->budget_id)
                ->where('assigned_to_user_id', $this->referred_to)
                ->where('assigned_from_user_id', $this->assigned_to)
                ->where('status', '!=', 'Pending')
                ->orderBy('updated_at', 'desc')
                ->first();
            
            if ($refereeTask) {
                $refereeStatus = $refereeTask->status === 'Approved' ? 'Approve' : ($refereeTask->status === 'Rejected' ? 'Reject' : $refereeTask->status);
            }
        }

        return [
            'id' => $this->id,
            'budget_id' => $this->budget_id,
            'requester_id' => $this->requester_id,
            'assigned_to' => $this->assigned_to,
            'referred_to' => $this->referred_to,
            'order' => $this->order,
            'description' => $this->description,
            'status' => $this->status,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,

            // Related resources
            'budget' => new BudgetResource($this->whenLoaded('budget')),
            'requester' => new UserResource($this->whenLoaded('requester')),
            'assigned_user' => new UserResource($this->whenLoaded('assignedUser')),
            'referred_user' => new UserResource($this->whenLoaded('referredUser')),
            'created_by_user' => new UserResource($this->whenLoaded('createdByUser')),
            'updated_by_user' => new UserResource($this->whenLoaded('updatedByUser')),

            // Add referee's status
            'referred_user_status' => $refereeStatus,

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
