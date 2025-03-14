<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TaskResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'process_step_id' => $this->process_step_id,
            'process_id' => $this->process_id,
            'assigned_at' => $this->assigned_at?->toISOString(),
            'deadline' => $this->deadline?->toISOString(),
            'urgency' => $this->urgency,
            'status' => $this->status,
            'assigned_user_id' => $this->assigned_user_id,
            'read_status' => $this->read_status?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Include related resources when loaded
            'process_step' => $this->whenLoaded('processStep'),
            'process' => $this->whenLoaded('process'),
            'assigned_user' => new UserResource($this->whenLoaded('assignedUser')),
            'descriptions' => TaskDescriptionResource::collection($this->whenLoaded('descriptions')),
        ];
    }
}
