<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PoApprovalTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Get referee's transaction status if this transaction has a referred_to user
        $refereeStatus = null;
        if ($this->referred_to) {
            // Look for referee's transaction - find their existing transaction for this purchase order
            $refereeTransaction = \App\Models\PoApprovalTransaction::where('purchase_order_id', $this->purchase_order_id)
                ->where('assigned_to', $this->referred_to)
                ->orderBy('updated_at', 'desc') // Get the most recently updated one
                ->first();
            $refereeStatus = $refereeTransaction ? $refereeTransaction->status : null;
        }

        return [
            'id' => $this->id,
            'purchase_order_id' => $this->purchase_order_id,
            'requester_id' => $this->requester_id,
            'assigned_to' => $this->assigned_to,
            'referred_to' => $this->referred_to,
            'order' => $this->order,
            'description' => $this->description,
            'status' => $this->status,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,

            // Include related resources when loaded
            'purchase_order' => new PurchaseOrderResource($this->whenLoaded('purchaseOrder')),
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
