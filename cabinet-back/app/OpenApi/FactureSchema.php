<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Schema(
    schema: 'Facture',
    required: ['client_id', 'date_facture', 'date_echeance', 'lignes'],
    properties: [
        new OA\Property(property: 'client_id', type: 'integer'),
        new OA\Property(property: 'dossier_id', type: 'integer', nullable: true),
        new OA\Property(property: 'date_facture', type: 'string', format: 'date'),
        new OA\Property(property: 'date_echeance', type: 'string', format: 'date'),
        new OA\Property(property: 'statut', type: 'string', enum: ['brouillon', 'en_attente', 'payee', 'annulee']),
        new OA\Property(property: 'notes', type: 'string', nullable: true),
        new OA\Property(
            property: 'lignes',
            type: 'array',
            items: new OA\Items(
                properties: [
                    new OA\Property(property: 'designation', type: 'string'),
                    new OA\Property(property: 'quantite', type: 'integer'),
                    new OA\Property(property: 'prix_unitaire', type: 'integer', description: 'En Ariary (entier)'),
                ]
            )
        ),
    ]
)]
class FactureSchema {}
