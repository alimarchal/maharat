<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaterialRequestTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Get referee's transaction status if this transaction has a referred_to user
        $refereeStatus = null;
        if ($this->referred_to) {
            // The referee's status is stored in the referrer's transaction
            // Look for the referrer's transaction that has this referee in referred_to
            $referrerTransaction = \App\Models\MaterialRequestTransaction::where('material_request_id', $this->material_request_id)
                ->where('assigned_to', $this->assigned_to) // This transaction's assignee
                ->where('referred_to', $this->referred_to) // The referee
                ->first();
            
            // Get the referee's status from the referrer's transaction
            if ($referrerTransaction) {
                // The referee's status is stored in a custom field or we need to get it from the task
                // For now, let's get it from the task that was created for the referee
                $refereeTask = \App\Models\Task::where('material_request_id', $this->material_request_id)
                    ->where('assigned_to_user_id', $this->referred_to)
                    ->where('assigned_from_user_id', $this->assigned_to)
                    ->where('status', '!=', 'Pending')
                    ->orderBy('updated_at', 'desc')
                    ->first();
                
                if ($refereeTask) {
                    $refereeStatus = $refereeTask->status === 'Approved' ? 'Approve' : ($refereeTask->status === 'Rejected' ? 'Reject' : $refereeTask->status);
                }
            }
        }

        return [
            'id' => $this->id,
            'material_request_id' => $this->material_request_id,
            'order' => $this->order,
            'requester_id' => $this->requester_id,
            'assigned_to' => $this->assigned_to,
            'referred_to' => $this->referred_to,
            'description' => $this->description,
            'status' => $this->status,
            'material_request' => new MaterialRequestResource($this->whenLoaded('materialRequest')),
            'requester' => new UserResource($this->whenLoaded('requester')),
            'assigned_user' => new UserResource($this->whenLoaded('assignedUser')),
            'referred_user' => new UserResource($this->whenLoaded('referredUser')),
            
            // Add referee's status
            'referred_user_status' => $refereeStatus,
            
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
