<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProcessStepResource extends JsonResource
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
            'process_id' => $this->process_id,
            'user_id' => $this->approver_id,
            'approver_id' => null, // get approver id here from up line
            'designation_id' => $this->designation_id,
            'order' => $this->order,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'timeout_days' => $this->timeout_days,
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Include related resources when loaded
            'process' => new ProcessResource($this->whenLoaded('process')),
            'user' => new UserResource($this->whenLoaded('user')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'updater' => new UserResource($this->whenLoaded('updater')),
        ];
    }
}
