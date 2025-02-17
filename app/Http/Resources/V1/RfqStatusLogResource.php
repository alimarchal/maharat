<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RfqStatusLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'rfq_id' => $this->rfq_id,
            'remarks' => $this->remarks,
            'documents' => $this->documents,
            'quotation_sent' => $this->quotation_sent,
            'status' => new StatusResource($this->whenLoaded('status')),
            'changed_by' => new UserResource($this->whenLoaded('changedBy')),
            'created_at' => $this->created_at,
        ];
    }
}
