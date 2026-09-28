<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Client',
    required: ['type_client', 'nom'],
    properties: [
        new OA\Property(property: 'type_client', type: 'string', enum: ['particulier', 'societe']),
        new OA\Property(property: 'nom', type: 'string'),
        new OA\Property(property: 'prenom', type: 'string', nullable: true),
        new OA\Property(property: 'raison_sociale', type: 'string', nullable: true),
        new OA\Property(property: 'email', type: 'string', format: 'email', nullable: true),
        new OA\Property(property: 'telephone', type: 'string', nullable: true),
        new OA\Property(property: 'adresse', type: 'string', nullable: true),
        new OA\Property(property: 'nif', type: 'string', nullable: true),
        new OA\Property(property: 'stat', type: 'string', nullable: true),
        new OA\Property(property: 'actif', type: 'boolean'),
    ]
)]
class ClientSchema {}
