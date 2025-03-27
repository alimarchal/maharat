<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetTransactionResource extends JsonResource
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
            'asset_id' => $this->asset_id,
            'transaction_type' => $this->transaction_type,
            'amount' => $this->amount,
            'transaction_date' => $this->transaction_date->format('Y-m-d'),
            'reference_number' => $this->reference_number,
            'notes' => $this->notes,
            'created_by' => $this->created_by,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),

            // Include related resources when loaded
            'asset' => new AssetResource($this->whenLoaded('asset')),
            'creator' => new UserResource($this->whenLoaded('creator')),
        ];
    }
}
