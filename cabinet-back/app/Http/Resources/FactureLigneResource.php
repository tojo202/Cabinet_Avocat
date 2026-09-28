<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FactureLigneResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'designation' => $this->designation,
            'quantite' => $this->quantite,
            'prix_unitaire' => $this->prix_unitaire,
            'montant' => $this->montant,
        ];
    }
}
