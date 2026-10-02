<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Utilisateur',
    required: ['name', 'email', 'role'],
    properties: [
        new OA\Property(property: 'name', type: 'string'),
        new OA\Property(property: 'email', type: 'string', format: 'email'),
        new OA\Property(property: 'role', type: 'string', enum: ['admin', 'avocat', 'secretaire', 'comptable']),
        new OA\Property(property: 'password', type: 'string', format: 'password', nullable: true),
    ]
)]
class UserSchema {}
