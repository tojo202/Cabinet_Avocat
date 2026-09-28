<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type_client' => $this->type_client?->value,
            'nom' => $this->nom,
            'prenom' => $this->prenom,
            'raison_sociale' => $this->raison_sociale,
            'nom_complet' => $this->nomComplet,
            'initiales' => $this->initiales,
            'email' => $this->email,
            'telephone' => $this->telephone,
            'adresse' => $this->adresse,
            'nif' => $this->nif,
            'stat' => $this->stat,
            'actif' => $this->actif,
            'dossiers_count' => $this->resource->dossiers_count ?? null,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
