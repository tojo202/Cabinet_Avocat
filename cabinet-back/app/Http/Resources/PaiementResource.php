<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaiementResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'facture_id' => $this->facture_id,
            'montant' => $this->montant,
            'mode' => $this->mode?->value,
            'date_paiement' => $this->date_paiement?->toDateString(),
            'reference' => $this->reference,
            'notes' => $this->notes,
            'facture' => new FactureResource($this->whenLoaded('facture')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
