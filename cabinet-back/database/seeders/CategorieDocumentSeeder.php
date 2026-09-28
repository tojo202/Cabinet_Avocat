<?php

namespace Database\Seeders;

use App\Models\CategorieDocument;
use Illuminate\Database\Seeder;

class CategorieDocumentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['nom' => 'Procédures', 'description' => 'Actes et pièces de procédure'],
            ['nom' => 'Correspondances', 'description' => 'Courriers échangés avec les clients et les tribunaux'],
            ['nom' => 'Contrats', 'description' => 'Contrats et conventions'],
            ['nom' => 'Pièces d\'identité', 'description' => 'CNI, passeports, extraits d\'acte'],
            ['nom' => 'Factures', 'description' => 'Factures et justificatifs de paiement'],
        ];

        foreach ($categories as $categorie) {
            CategorieDocument::firstOrCreate(
                ['nom' => $categorie['nom']],
                ['description' => $categorie['description']],
            );
        }
    }
}
