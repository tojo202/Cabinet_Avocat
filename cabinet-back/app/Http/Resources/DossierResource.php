<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DossierResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'client_id' => $this->client_id,
            'client' => new ClientResource($this->whenLoaded('client')),
            'titre' => $this->titre,
            'description' => $this->description,
            'type_droit' => $this->type_droit,
            'statut' => $this->statut?->value,
            'priorite' => $this->priorite?->value,
            'avancement' => $this->avancement,
            'montant' => $this->montant,
            'is_en_retard' => $this->isEnRetard(),
            'date_ouverture' => $this->date_ouverture?->toDateString(),
            'date_cloture' => $this->date_cloture?->toDateString(),
            'avocats' => AvocatResource::collection($this->whenLoaded('avocats')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
