<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Dossier',
    required: ['client_id', 'titre', 'type_droit', 'date_ouverture'],
    properties: [
        new OA\Property(property: 'client_id', type: 'integer'),
        new OA\Property(property: 'titre', type: 'string'),
        new OA\Property(property: 'description', type: 'string', nullable: true),
        new OA\Property(property: 'type_droit', type: 'string'),
        new OA\Property(property: 'statut', type: 'string', enum: ['en_cours', 'en_revision', 'en_attente', 'cloture']),
        new OA\Property(property: 'priorite', type: 'string', enum: ['normale', 'haute', 'urgente']),
        new OA\Property(property: 'avancement', type: 'integer', minimum: 0, maximum: 100),
        new OA\Property(property: 'montant', type: 'integer', nullable: true, description: 'Montant en Ariary (entier)'),
        new OA\Property(property: 'date_ouverture', type: 'string', format: 'date'),
        new OA\Property(property: 'date_cloture', type: 'string', format: 'date', nullable: true),
        new OA\Property(property: 'avocat_ids', type: 'array', items: new OA\Items(type: 'integer')),
    ]
)]
class DossierSchema {}
