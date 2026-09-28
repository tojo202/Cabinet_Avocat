<?php

namespace Database\Seeders;

use App\Models\CategorieDocument;
use App\Models\Document;
use App\Models\Dossier;
use App\Models\User;
use Illuminate\Database\Seeder;

class DocumentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $noms = [
            'Assignation à comparaître',
            'Conclusions en défense',
            'Contrat de prestation de services',
            'Procès-verbal d\'audience',
            'Mise en demeure',
            'CNI du client',
            'Facture d\'honoraires N°1',
            'Quittance de paiement',
            'Titre foncier',
            'Extrait d\'acte de naissance',
            'Correspondance cabinet — adversaire',
            'Jugement',
        ];

        foreach ($noms as $nom) {
            Document::create([
                'dossier_id' => Dossier::inRandomOrder()->first()?->id,
                'categorie_document_id' => CategorieDocument::inRandomOrder()->first()?->id,
                'user_id' => User::inRandomOrder()->first()?->id,
                'nom' => $nom.'.pdf',
                'path' => 'documents/'.fake()->uuid().'/'.$nom.'.pdf',
                'mime_type' => 'application/pdf',
                'taille' => fake()->numberBetween(50_000, 8_000_000),
            ]);
        }
    }
}
