<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentOrderApprovalTransactionResource extends JsonResource
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
            // Look for referee's transaction - find their existing transaction for this payment order
            $refereeTransaction = \App\Models\PaymentOrderApprovalTransaction::where('payment_order_id', $this->payment_order_id)
                ->where('assigned_to', $this->referred_to)
                ->orderBy('updated_at', 'desc') // Get the most recently updated one
                ->first();
            $refereeStatus = $refereeTransaction ? $refereeTransaction->status : null;
            
            // Debug logging
            \Log::info('=== API RESOURCE REFEREE STATUS DEBUG ===', [
                'payment_order_id' => $this->payment_order_id,
                'referred_to' => $this->referred_to,
                'referee_transaction_found' => $refereeTransaction ? true : false,
                'referee_status' => $refereeStatus,
                'referee_transaction_id' => $refereeTransaction ? $refereeTransaction->id : null,
                'referee_transaction_updated_at' => $refereeTransaction ? $refereeTransaction->updated_at : null,
                'all_referee_transactions' => \App\Models\PaymentOrderApprovalTransaction::where('payment_order_id', $this->payment_order_id)
                    ->where('assigned_to', $this->referred_to)
                    ->get(['id', 'status', 'created_at', 'updated_at'])
                    ->toArray()
            ]);
        }

        return [
            'id' => $this->id,
            'payment_order_id' => $this->payment_order_id,
            'requester_id' => $this->requester_id,
            'assigned_to' => $this->assigned_to,
            'referred_to' => $this->referred_to,
            'order' => $this->order,
            'description' => $this->description,
            'status' => $this->status,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,

            // Related resources
            'payment_order' => new PaymentOrderResource($this->whenLoaded('paymentOrder')),
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
