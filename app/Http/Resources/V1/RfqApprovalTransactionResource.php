<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RfqApprovalTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Get referee's transaction status if this transaction has a referred_to user
        $refereeStatus = null;
        if ($this->referred_to) {
            // Get the referee's status from the task that was created for the referee
            $refereeTask = \App\Models\Task::where('rfq_id', $this->rfq_id)
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
            'rfq_id' => $this->rfq_id,
            'requester_id' => $this->requester_id,
            'assigned_to' => $this->assigned_to,
            'referred_to' => $this->referred_to,
            'order' => $this->order,
            'description' => $this->description,
            'status' => $this->status,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,

            // Include related resources when loaded
            'rfq' => new RfqResource($this->whenLoaded('rfq')),
            'requester' => new UserResource($this->whenLoaded('requester')),
            'assigned_to_user' => new UserResource($this->whenLoaded('assignedTo')),
            'referred_to_user' => new UserResource($this->whenLoaded('referredTo')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'updater' => new UserResource($this->whenLoaded('updater')),

            // Add referee's status
            'referred_user_status' => $refereeStatus,

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
