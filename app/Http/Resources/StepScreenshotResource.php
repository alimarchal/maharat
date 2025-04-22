<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class StepScreenshotResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'screenshot_path' => $this->screenshot_path,
            'screenshot_url' => Storage::url($this->screenshot_path),
            'alt_text' => $this->alt_text,
            'caption' => $this->caption,
            'type' => $this->type,
            'order' => $this->order,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
