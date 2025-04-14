<?php

namespace App\Http\Resources\V1;

use App\Models\WarehouseManager;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WarehouseResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $data = [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'address' => $this->address,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];

        // Add the manager data if it's loaded
        if ($this->relationLoaded('manager') && $this->manager) {
            $data['manager'] = [
                'id' => $this->manager->id,
                'type' => $this->manager->type,
                'user' => [
                    'id' => $this->manager->manager_id,
                    'name' => $this->manager->manager->name ?? null,
                    // Add other user fields as needed
                ]
            ];
        }

        return $data;
    }
}
