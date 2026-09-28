<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Avocat',
    required: ['nom', 'prenom'],
    properties: [
        new OA\Property(property: 'nom', type: 'string'),
        new OA\Property(property: 'prenom', type: 'string'),
        new OA\Property(property: 'specialite', type: 'string', nullable: true),
        new OA\Property(property: 'telephone', type: 'string', nullable: true),
        new OA\Property(property: 'barreau', type: 'string', nullable: true),
        new OA\Property(property: 'actif', type: 'boolean'),
        new OA\Property(property: 'email', type: 'string', format: 'email'),
        new OA\Property(property: 'password', type: 'string', format: 'password'),
    ]
)]
class AvocatSchema {}
