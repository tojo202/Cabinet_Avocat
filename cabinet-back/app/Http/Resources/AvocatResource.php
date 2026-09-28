<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AvocatResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'nom' => $this->nom,
            'prenom' => $this->prenom,
            'nom_complet' => $this->nomComplet,
            'initiales' => $this->initiales,
            'specialite' => $this->specialite,
            'telephone' => $this->telephone,
            'barreau' => $this->barreau,
            'actif' => $this->actif,
            'email' => $this->whenLoaded('user', fn () => $this->user?->email),
            'user' => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
            ],
            'dossiers_count' => $this->resource->dossiers_count ?? null,
            'dossiers' => DossierResource::collection($this->whenLoaded('dossiers')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
