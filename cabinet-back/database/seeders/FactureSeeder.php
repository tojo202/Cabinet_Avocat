<?php

namespace Database\Seeders;

use App\Enums\ModePaiement;
use App\Enums\StatutFacture;
use App\Models\Client;
use App\Models\Dossier;
use App\Models\Facture;
use Illuminate\Database\Seeder;

class FactureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $factures = [
            ['statut' => StatutFacture::Payee, 'jours' => 90, 'echeance' => 30, 'montant' => 3_500_000, 'payee' => true],
            ['statut' => StatutFacture::Payee, 'jours' => 60, 'echeance' => 30, 'montant' => 1_800_000, 'payee' => true],
            ['statut' => StatutFacture::EnAttente, 'jours' => 45, 'echeance' => 15, 'montant' => 5_200_000, 'payee' => false],   // en retard
            ['statut' => StatutFacture::EnAttente, 'jours' => 10, 'echeance' => 20, 'montant' => 2_400_000, 'payee' => false],   // à venir
            ['statut' => StatutFacture::Brouillon, 'jours' => 3, 'echeance' => 30, 'montant' => 950_000, 'payee' => false],
            ['statut' => StatutFacture::EnAttente, 'jours' => 40, 'echeance' => 10, 'montant' => 7_800_000, 'payee' => false],   // en retard
            ['statut' => StatutFacture::Payee, 'jours' => 30, 'echeance' => 30, 'montant' => 4_100_000, 'payee' => true],
            ['statut' => StatutFacture::Annulee, 'jours' => 20, 'echeance' => 30, 'montant' => 1_200_000, 'payee' => false],
            ['statut' => StatutFacture::EnAttente, 'jours' => 5, 'echeance' => 45, 'montant' => 6_300_000, 'payee' => false],
            ['statut' => StatutFacture::Payee, 'jours' => 120, 'echeance' => 30, 'montant' => 2_750_000, 'payee' => true],
        ];

        foreach ($factures as $data) {
            $dateFacture = now()->subDays($data['jours']);
            $year = (int) $dateFacture->format('Y');
            $nextNumber = Facture::withTrashed()->whereYear('date_facture', $year)->count() + 1;

            $dossier = Dossier::inRandomOrder()->first();
            $client = $dossier?->client ?? Client::inRandomOrder()->first();

            $facture = Facture::firstOrCreate(
                ['numero' => sprintf('FACT-%d-%03d', $year, $nextNumber)],
                [
                    'client_id' => $client->id,
                    'dossier_id' => $dossier?->id,
                    'date_facture' => $dateFacture->toDateString(),
                    'date_echeance' => $dateFacture->addDays($data['echeance'])->toDateString(),
                    'statut' => $data['statut']->value,
                    'montant_total' => $data['montant'],
                    'notes' => null,
                ],
            );

            if ($facture->lignes()->exists()) {
                continue;
            }

            $lignes = [
                ['designation' => 'Honoraires de consultation', 'quantite' => 1, 'prix_unitaire' => (int) ($data['montant'] * 0.6)],
                ['designation' => 'Assistance en audience', 'quantite' => 2, 'prix_unitaire' => (int) ($data['montant'] * 0.2 / 2)],
            ];

            foreach ($lignes as $ligne) {
                $facture->lignes()->create($ligne + ['montant' => $ligne['quantite'] * $ligne['prix_unitaire']]);
            }

            if ($data['payee']) {
                $facture->paiements()->create([
                    'montant' => $facture->montant_total,
                    'mode' => fake()->randomElement(ModePaiement::cases())->value,
                    'date_paiement' => $dateFacture->addDays(rand(5, 25))->toDateString(),
                    'reference' => strtoupper(fake()->lexify('????-####')),
                ]);
            }
        }
    }
}
