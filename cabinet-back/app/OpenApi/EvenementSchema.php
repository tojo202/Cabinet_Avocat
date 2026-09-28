<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Evenement',
    required: ['titre', 'type', 'debut'],
    properties: [
        new OA\Property(property: 'titre', type: 'string'),
        new OA\Property(property: 'type', type: 'string', enum: ['rendez_vous', 'audience', 'echeance']),
        new OA\Property(property: 'debut', type: 'string', format: 'date-time'),
        new OA\Property(property: 'fin', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'dossier_id', type: 'integer', nullable: true),
        new OA\Property(property: 'client_id', type: 'integer', nullable: true),
        new OA\Property(property: 'lieu', type: 'string', nullable: true),
        new OA\Property(property: 'description', type: 'string', nullable: true),
    ]
)]
class EvenementSchema {}
