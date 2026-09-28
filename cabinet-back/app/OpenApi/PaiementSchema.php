<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Paiement',
    required: ['montant', 'mode', 'date_paiement'],
    properties: [
        new OA\Property(property: 'montant', type: 'integer', description: 'En Ariary (entier)'),
        new OA\Property(property: 'mode', type: 'string', enum: ['especes', 'virement', 'mobile_money', 'cheque']),
        new OA\Property(property: 'date_paiement', type: 'string', format: 'date'),
        new OA\Property(property: 'reference', type: 'string', nullable: true),
        new OA\Property(property: 'notes', type: 'string', nullable: true),
    ]
)]
class PaiementSchema {}
