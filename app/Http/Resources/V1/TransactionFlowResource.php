<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TransactionFlowResource extends JsonResource
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
            'account_id' => $this->account_id,
            'transaction_type' => $this->transaction_type,
            'amount' => $this->amount,
            'balance_after' => $this->balance_after,
            'related_entity_type' => $this->related_entity_type,
            'related_entity_id' => $this->related_entity_id,
            'related_accounts' => $this->related_accounts,
            'description' => $this->description,
            'reference_number' => $this->reference_number,
            'transaction_date' => $this->transaction_date?->format('Y-m-d'),
            'attachment' => $this->attachment,
            'original_name' => $this->original_name,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),

            // Include related resources when loaded
            'account' => $this->whenLoaded('account', function () {
                return new AccountResource($this->account);
            }),
            'creator' => $this->whenLoaded('creator', function () {
                return new UserResource($this->creator);
            }),
            'updater' => $this->whenLoaded('updater', function () {
                return new UserResource($this->updater);
            }),
        ];
    }
}
