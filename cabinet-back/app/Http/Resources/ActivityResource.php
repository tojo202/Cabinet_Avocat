<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'log_name' => $this->log_name,
            'description' => $this->description,
            'event' => $this->event,
            'properties' => $this->properties,
            'causer' => [
                'id' => $this->causer?->id,
                'name' => $this->causer?->name,
            ],
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
