<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'dossier_id' => $this->dossier_id,
            'dossier' => new DossierResource($this->whenLoaded('dossier')),
            'categorie_document_id' => $this->categorie_document_id,
            'categorie' => new CategorieDocumentResource($this->whenLoaded('categorie')),
            'nom' => $this->nom,
            'mime_type' => $this->mime_type,
            'taille' => $this->taille,
            'user_id' => $this->user_id,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
