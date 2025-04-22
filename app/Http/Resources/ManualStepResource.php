<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ManualStepResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'step_number' => $this->step_number,
            'title' => $this->title,
            'description' => $this->description,
            'action_type' => $this->action_type,
            'order' => $this->order,
            'is_active' => $this->is_active,
            'details' => StepDetailResource::collection($this->whenLoaded('details')),
            'screenshots' => StepScreenshotResource::collection($this->whenLoaded('screenshots')),
            'actions' => StepActionResource::collection($this->whenLoaded('actions')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
