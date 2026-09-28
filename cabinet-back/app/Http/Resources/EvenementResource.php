<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EvenementResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'dossier_id' => $this->dossier_id,
            'client_id' => $this->client_id,
            'titre' => $this->titre,
            'type' => $this->type?->value,
            'debut' => $this->debut?->toIso8601String(),
            'fin' => $this->fin?->toIso8601String(),
            'lieu' => $this->lieu,
            'description' => $this->description,
            'dossier' => new DossierResource($this->whenLoaded('dossier')),
            'client' => new ClientResource($this->whenLoaded('client')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
