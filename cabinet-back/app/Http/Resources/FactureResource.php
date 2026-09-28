<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FactureResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'numero' => $this->numero,
            'client_id' => $this->client_id,
            'client' => new ClientResource($this->whenLoaded('client')),
            'dossier_id' => $this->dossier_id,
            'dossier' => new DossierResource($this->whenLoaded('dossier')),
            'date_facture' => $this->date_facture?->toDateString(),
            'date_echeance' => $this->date_echeance?->toDateString(),
            'statut' => $this->statut?->value,
            'montant_total' => $this->montant_total,
            'montant_paye' => $this->montantPaye,
            'solde' => $this->solde,
            'is_en_retard' => $this->isEnRetard(),
            'notes' => $this->notes,
            'lignes' => FactureLigneResource::collection($this->whenLoaded('lignes')),
            'paiements' => PaiementResource::collection($this->whenLoaded('paiements')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
