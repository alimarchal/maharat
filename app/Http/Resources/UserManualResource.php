<?php

namespace App\Http\Resources;

use App\Http\Resources\V1\UserResource;
use Illuminate\Http\Resources\Json\JsonResource;

class UserManualResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'video_path' => $this->video_path,
            'video_url' => $this->video_path ? Storage::url($this->video_path) : null,
            'video_type' => $this->video_type,
            'is_active' => $this->is_active,
            'steps' => ManualStepResource::collection($this->whenLoaded('steps')),
            'creator' => new UserResource($this->whenLoaded('creator')),
            'updater' => new UserResource($this->whenLoaded('updater')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
