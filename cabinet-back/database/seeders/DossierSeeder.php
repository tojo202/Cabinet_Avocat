<?php

namespace Database\Seeders;

use App\Enums\PrioriteDossier;
use App\Enums\StatutDossier;
use App\Enums\TypeClient;
use App\Models\Avocat;
use App\Models\Client;
use App\Models\Dossier;
use Illuminate\Database\Seeder;

class DossierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $avocats = Avocat::all();

        $dossiers = [
            ['titre' => 'Rakoto c. Ministère Public — affaire de vol aggravé', 'type_droit' => 'pénal', 'statut' => StatutDossier::EnCours, 'priorite' => PrioriteDossier::Urgente, 'avancement' => 65, 'montant' => 4_500_000, 'mois' => 8],
            ['titre' => 'Litige contractuel — livraison non conforme', 'type_droit' => 'commercial', 'statut' => StatutDossier::EnRevision, 'priorite' => PrioriteDossier::Haute, 'avancement' => 45, 'montant' => 12_000_000, 'mois' => 6],
            ['titre' => 'Divorce par consentement mutuel Rasoa / Haja', 'type_droit' => 'famille', 'statut' => StatutDossier::EnCours, 'priorite' => PrioriteDossier::Normale, 'avancement' => 30, 'montant' => 2_800_000, 'mois' => 4],
            ['titre' => 'Contentieux fiscal — redressement URSSAF malgache', 'type_droit' => 'fiscal', 'statut' => StatutDossier::EnAttente, 'priorite' => PrioriteDossier::Haute, 'avancement' => 20, 'montant' => 18_500_000, 'mois' => 10],
            ['titre' => 'Recouvrement de créance — ETS Ranaivo', 'type_droit' => 'commercial', 'statut' => StatutDossier::EnCours, 'priorite' => PrioriteDossier::Normale, 'avancement' => 55, 'montant' => 7_200_000, 'mois' => 3],
            ['titre' => 'Succession Rakotoarisoa — partage des biens', 'type_droit' => 'famille', 'statut' => StatutDossier::EnCours, 'priorite' => PrioriteDossier::Normale, 'avancement' => 40, 'montant' => 5_600_000, 'mois' => 7],
            ['titre' => 'Bail commercial — résiliation anticipée', 'type_droit' => 'foncier', 'statut' => StatutDossier::Cloture, 'priorite' => PrioriteDossier::Normale, 'avancement' => 100, 'montant' => 3_400_000, 'mois' => 14],
            ['titre' => 'Accident de travail — indemnisation salarié', 'type_droit' => 'social', 'statut' => StatutDossier::EnCours, 'priorite' => PrioriteDossier::Urgente, 'avancement' => 75, 'montant' => 6_100_000, 'mois' => 2],
            ['titre' => 'Poursuites abusives — demande de dommages-intérêts', 'type_droit' => 'pénal', 'statut' => StatutDossier::EnRevision, 'priorite' => PrioriteDossier::Normale, 'avancement' => 50, 'montant' => 4_200_000, 'mois' => 5],
            ['titre' => 'Constitution de société — Madagascar Tech Services', 'type_droit' => 'commercial', 'statut' => StatutDossier::Cloture, 'priorite' => PrioriteDossier::Normale, 'avancement' => 100, 'montant' => 2_100_000, 'mois' => 16],
            ['titre' => 'Garde d\'enfant — modification de la décision', 'type_droit' => 'famille', 'statut' => StatutDossier::EnAttente, 'priorite' => PrioriteDossier::Haute, 'avancement' => 25, 'montant' => 3_800_000, 'mois' => 1],
            ['titre' => 'Contentieux administratif — recours pour excès de pouvoir', 'type_droit' => 'administratif', 'statut' => StatutDossier::EnCours, 'priorite' => PrioriteDossier::Normale, 'avancement' => 35, 'montant' => 9_000_000, 'mois' => 9],
            ['titre' => 'Violation de contrat de travail — licenciement sans cause', 'type_droit' => 'social', 'statut' => StatutDossier::Cloture, 'priorite' => PrioriteDossier::Haute, 'avancement' => 100, 'montant' => 1_950_000, 'mois' => 12],
            ['titre' => 'Usurpation de marque — action en contrefaçon', 'type_droit' => 'commercial', 'statut' => StatutDossier::EnCours, 'priorite' => PrioriteDossier::Haute, 'avancement' => 60, 'montant' => 15_000_000, 'mois' => 5],
            ['titre' => 'Titre foncier litigieux — revendication', 'type_droit' => 'foncier', 'statut' => StatutDossier::EnRevision, 'priorite' => PrioriteDossier::Urgente, 'avancement' => 48, 'montant' => 22_000_000, 'mois' => 11],
        ];

        $societes = Client::where('type_client', TypeClient::Societe->value)->get();
        $particuliers = Client::where('type_client', TypeClient::Particulier->value)->get();

        foreach ($dossiers as $index => $data) {
            $dateOuverture = now()->subMonths($data['mois'])->startOfDay();
            $year = (int) $dateOuverture->format('Y');
            $nextNumber = Dossier::withTrashed()->whereYear('date_ouverture', $year)->count() + 1;

            $client = str_contains($data['type_droit'], 'commercial')
                ? $societes->random()
                : ($particuliers->random() ?? $societes->random());

            $dossier = Dossier::firstOrCreate(
                ['titre' => $data['titre']],
                [
                    'reference' => sprintf('DOS-%d-%03d', $year, $nextNumber),
                    'client_id' => $client->id,
                    'description' => "Dossier de droit {$data['type_droit']} suivi par le cabinet.",
                    'type_droit' => $data['type_droit'],
                    'statut' => $data['statut']->value,
                    'priorite' => $data['priorite']->value,
                    'avancement' => $data['avancement'],
                    'montant' => $data['montant'],
                    'date_ouverture' => $dateOuverture->toDateString(),
                    'date_cloture' => $data['statut'] === StatutDossier::Cloture
                        ? $dateOuverture->addMonths(rand(3, 10))->toDateString()
                        : null,
                ],
            );

            if ($avocats->isNotEmpty() && $dossier->avocats()->count() === 0) {
                $assignes = $avocats->random(min(2, $avocats->count()));
                foreach ($assignes as $i => $avocat) {
                    $dossier->avocats()->attach($avocat->id, ['role' => $i === 0 ? 'principal' : 'collaborateur']);
                }
            }
        }
    }
}
