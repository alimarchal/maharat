<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class StepActionResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'action_type' => $this->action_type,
            'label' => $this->label,
            'url_or_action' => $this->url_or_action,
            'style' => $this->style,
            'order' => $this->order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
