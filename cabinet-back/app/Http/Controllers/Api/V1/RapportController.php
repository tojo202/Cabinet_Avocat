<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ModePaiement;
use App\Enums\StatutDossier;
use App\Enums\StatutFacture;
use App\Http\Controllers\Controller;
use App\Models\Avocat;
use App\Models\Client;
use App\Models\Dossier;
use App\Models\Facture;
use App\Models\Paiement;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

class RapportController extends Controller
{
    #[OA\Get(
        path: '/api/v1/rapports/synthese',
        summary: 'Synthèse d\'activité sur une période',
        tags: ['Rapports'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'debut', in: 'query', schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'fin', in: 'query', schema: new OA\Schema(type: 'string', format: 'date')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Synthèse (KPI, répartitions, tops)'),
            new OA\Response(response: 403, description: 'Droit « rapports.view » requis'),
            new OA\Response(response: 422, description: 'Période invalide'),
        ]
    )]
    public function synthese(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('rapports.view'), 403);

        [$debut, $fin] = $this->periode($request);
        $user = $request->user();

        $factures = $this->facturesQuery($user)
            ->whereBetween('date_facture', [$debut->toDateString(), $fin->toDateString()])
            ->where('statut', '!=', StatutFacture::Annulee->value)
            ->with(['client:id,nom,prenom,raison_sociale,type_client', 'paiements'])
            ->get();

        $paiements = $this->paiementsQuery($user)
            ->whereBetween('date_paiement', [$debut->toDateString(), $fin->toDateString()])
            ->get();

        $dossiers = $this->dossiersQuery($user)
            ->whereBetween('date_ouverture', [$debut->toDateString(), $fin->toDateString()])
            ->with('avocats:id,nom,prenom')
            ->get();

        $dossiersClotures = $this->dossiersQuery($user)
            ->whereBetween('date_cloture', [$debut->toDateString(), $fin->toDateString()])
            ->count();

        $compteurStatuts = $dossiers->countBy(fn (Dossier $dossier): string => $dossier->statut->value);
        $compteurModes = $paiements->countBy(fn (Paiement $paiement): string => $paiement->mode->value);
        $totauxModes = $paiements->groupBy(fn (Paiement $paiement): string => $paiement->mode->value)
            ->map(fn ($groupe): int => (int) $groupe->sum('montant'));

        $topClients = $factures
            ->groupBy(fn (Facture $facture): int => $facture->client_id)
            ->map(fn ($groupe, $clientId): array => [
                'id' => (int) $clientId,
                'nombre_factures' => $groupe->count(),
                'montant' => (int) $groupe->sum('montant_total'),
            ])
            ->sortByDesc('montant')
            ->values()
            ->take(5);

        $clientsParId = Client::whereIn('id', $topClients->pluck('id'))
            ->get()
            ->keyBy('id');

        $topClients = $topClients->map(fn (array $ligne): array => [
            ...$ligne,
            'nom' => $clientsParId->get($ligne['id'])?->nomComplet ?? 'Client supprimé',
        ]);

        $parAvocat = $dossiers
            ->flatMap(fn (Dossier $dossier) => $dossier->avocats)
            ->countBy(fn ($avocat): int => $avocat->id)
            ->map(fn (int $total, int $avocatId): array => [
                'id' => $avocatId,
                'dossiers' => $total,
            ])
            ->values()
            ->sortByDesc('dossiers')
            ->values();

        $avocatsParId = collect($parAvocat)->isEmpty()
            ? collect()
            : Avocat::whereIn('id', $parAvocat->pluck('id'))->get()->keyBy('id');

        $parAvocat = $parAvocat->map(fn (array $ligne): array => [
            ...$ligne,
            'nom_complet' => $avocatsParId->get($ligne['id'])?->nomComplet ?? '—',
        ]);

        return response()->json([
            'periode' => [
                'debut' => $debut->toDateString(),
                'fin' => $fin->toDateString(),
            ],
            'nouveaux_clients' => Client::whereBetween('created_at', [$debut, $fin])->count(),
            'dossiers_ouverts' => $dossiers->count(),
            'dossiers_clotures' => $dossiersClotures,
            'dossiers_par_statut' => collect(StatutDossier::cases())->map(fn (StatutDossier $statut): array => [
                'statut' => $statut->value,
                'total' => $compteurStatuts->get($statut->value, 0),
            ]),
            'facturation' => [
                'nb_factures' => $factures->count(),
                'facture' => (int) $factures->sum('montant_total'),
                'encaisse' => (int) $paiements->sum('montant'),
                'impaye' => (int) $factures->sum(fn (Facture $facture): int => max(
                    0,
                    $facture->montant_total - $facture->paiements->sum('montant'),
                )),
            ],
            'paiements' => [
                'nombre' => $paiements->count(),
                'total' => (int) $paiements->sum('montant'),
                'par_mode' => collect(ModePaiement::cases())->map(fn (ModePaiement $mode): array => [
                    'mode' => $mode->value,
                    'nombre' => $compteurModes->get($mode->value, 0),
                    'total' => $totauxModes->get($mode->value, 0),
                ]),
            ],
            'top_clients' => $topClients,
            'par_avocat' => $parAvocat,
        ]);
    }

    #[OA\Get(
        path: '/api/v1/rapports/evolution',
        summary: 'Évolution mensuelle (ou annuelle) de l\'activité',
        tags: ['Rapports'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'debut', in: 'query', schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'fin', in: 'query', schema: new OA\Schema(type: 'string', format: 'date')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Série temporelle pour les graphiques'),
            new OA\Response(response: 403, description: 'Droit « rapports.view » requis'),
            new OA\Response(response: 422, description: 'Période invalide'),
        ]
    )]
    public function evolution(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('rapports.view'), 403);

        [$debut, $fin] = $this->periode($request);
        $user = $request->user();

        $factures = $this->facturesQuery($user)
            ->whereBetween('date_facture', [$debut->toDateString(), $fin->toDateString()])
            ->get(['date_facture', 'montant_total']);

        $paiements = $this->paiementsQuery($user)
            ->whereBetween('date_paiement', [$debut->toDateString(), $fin->toDateString()])
            ->get(['date_paiement', 'montant']);

        $dossiers = $this->dossiersQuery($user)
            ->whereBetween('date_ouverture', [$debut->toDateString(), $fin->toDateString()])
            ->get(['date_ouverture']);

        $parMois = $debut->copy()->startOfMonth()->monthsUntil($fin->copy()->startOfMonth())->count();
        $granularite = $parMois > 36 ? 'an' : 'mois';

        $points = [];
        $courant = $debut->copy()->startOfMonth();

        while ($courant->lte($fin)) {
            $points[$courant->format($granularite === 'an' ? 'Y' : 'Y-m')] = [
                'periode' => $courant->format($granularite === 'an' ? 'Y' : 'Y-m'),
                'factures' => 0,
                'encaisse' => 0,
                'dossiers' => 0,
            ];
            $courant = $granularite === 'an' ? $courant->addYear()->startOfYear() : $courant->addMonthNoOverflow();
        }

        foreach ($factures as $facture) {
            $cle = $facture->date_facture->format($granularite === 'an' ? 'Y' : 'Y-m');
            if (isset($points[$cle])) {
                $points[$cle]['factures'] += (int) $facture->montant_total;
            }
        }

        foreach ($paiements as $paiement) {
            $cle = $paiement->date_paiement->format($granularite === 'an' ? 'Y' : 'Y-m');
            if (isset($points[$cle])) {
                $points[$cle]['encaisse'] += (int) $paiement->montant;
            }
        }

        foreach ($dossiers as $dossier) {
            $cle = $dossier->date_ouverture->format($granularite === 'an' ? 'Y' : 'Y-m');
            if (isset($points[$cle])) {
                $points[$cle]['dossiers'] += 1;
            }
        }

        return response()->json([
            'granularite' => $granularite,
            'periode' => [
                'debut' => $debut->toDateString(),
                'fin' => $fin->toDateString(),
            ],
            'data' => array_values($points),
        ]);
    }

    #[OA\Get(
        path: '/api/v1/rapports/export',
        summary: 'Export CSV des factures de la période',
        tags: ['Rapports'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'debut', in: 'query', schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'fin', in: 'query', schema: new OA\Schema(type: 'string', format: 'date')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Fichier CSV'),
            new OA\Response(response: 403, description: 'Droit « rapports.view » requis'),
        ]
    )]
    public function export(Request $request): Response
    {
        abort_unless($request->user()->can('rapports.view'), 403);

        [$debut, $fin] = $this->periode($request);

        $factures = $this->facturesQuery($request->user())
            ->whereBetween('date_facture', [$debut->toDateString(), $fin->toDateString()])
            ->with(['client:id,nom,prenom,raison_sociale,type_client', 'dossier:id,reference,titre', 'paiements'])
            ->orderBy('date_facture')
            ->get();

        $handle = fopen('php://temp', 'r+');
        fputcsv($handle, [
            'N° facture', 'Date', 'Client', 'Dossier', 'Statut',
            'Montant total', 'Montant payé', 'Solde', 'Échéance',
        ]);

        foreach ($factures as $facture) {
            $paye = (int) $facture->paiements->sum('montant');

            fputcsv($handle, [
                $facture->numero,
                $facture->date_facture?->format('d/m/Y'),
                $facture->client?->nomComplet ?? '—',
                $facture->dossier?->reference ?? '—',
                $facture->statut->value,
                $facture->montant_total,
                $paye,
                $facture->montant_total - $paye,
                $facture->date_echeance?->format('d/m/Y'),
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="rapport-'.now()->format('Ymd').'.csv"',
        ]);
    }

    /**
     * Période demandée (par défaut : le mois en cours).
     *
     * @return array{0: Carbon, 1: Carbon}
     */
    private function periode(Request $request): array
    {
        $data = $request->validate([
            'debut' => ['nullable', 'date'],
            'fin' => ['nullable', 'date'],
        ]);

        $debut = isset($data['debut']) ? Carbon::parse($data['debut'])->startOfDay() : now()->startOfMonth();
        $fin = isset($data['fin']) ? Carbon::parse($data['fin'])->endOfDay() : now()->endOfDay();

        if ($fin->lt($debut)) {
            throw ValidationException::withMessages([
                'fin' => 'La date de fin doit être postérieure à la date de début.',
            ]);
        }

        return [$debut, $fin];
    }

    private function facturesQuery(User $user): Builder
    {
        $query = Facture::query();

        if ($user->hasRole('avocat') && $avocat = $user->avocat) {
            $query->whereHas('dossier', fn (Builder $q) => $q
                ->whereHas('avocats', fn (Builder $qa) => $qa->where('avocats.id', $avocat->id)));
        }

        return $query;
    }

    private function paiementsQuery(User $user): Builder
    {
        $query = Paiement::query();

        if ($user->hasRole('avocat') && $avocat = $user->avocat) {
            $query->whereHas('facture', fn (Builder $q) => $q
                ->whereHas('dossier', fn (Builder $qd) => $qd
                    ->whereHas('avocats', fn (Builder $qa) => $qa->where('avocats.id', $avocat->id))));
        }

        return $query;
    }

    private function dossiersQuery(User $user): Builder
    {
        $query = Dossier::query();

        if ($user->hasRole('avocat') && $avocat = $user->avocat) {
            $query->whereHas('avocats', fn (Builder $q) => $q->where('avocats.id', $avocat->id));
        }

        return $query;
    }
}
