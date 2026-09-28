<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaiementResource;
use App\Models\Facture;
use App\Models\Paiement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use OpenApi\Attributes as OA;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;

class PaiementController extends Controller
{
    #[OA\Get(
        path: '/api/v1/paiements',
        summary: 'Liste des paiements enregistrés',
        tags: ['Paiements'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'mode', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'search', in: 'query', schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Pagination des paiements'),
        ]
    )]
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Facture::class);

        $query = QueryBuilder::for(Paiement::class, $request)
            ->allowedFilters(...[
                AllowedFilter::exact('mode'),
                AllowedFilter::exact('facture_id'),
            ])
            ->allowedSorts(...[
                AllowedSort::field('date_paiement'),
                AllowedSort::field('montant'),
                AllowedSort::field('created_at'),
            ])
            ->with(['facture.client', 'facture.dossier'])
            ->defaultSort('-date_paiement');

        if ($request->user()->hasRole('avocat') && $avocat = $request->user()->avocat) {
            $query->whereHas('facture', fn ($q) => $q
                ->whereHas('dossier', fn ($qd) => $qd
                    ->whereHas('avocats', fn ($qa) => $qa->where('avocats.id', $avocat->id))));
        }

        return PaiementResource::collection($query->paginate($request->integer('per_page', 15)));
    }

    #[OA\Get(
        path: '/api/v1/paiements/stats',
        summary: 'Statistiques des encaissements',
        tags: ['Paiements'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Statistiques'),
        ]
    )]
    public function stats(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Facture::class);

        $paiements = Paiement::query();

        if ($request->user()->hasRole('avocat') && $avocat = $request->user()->avocat) {
            $paiements->whereHas('facture', fn ($q) => $q
                ->whereHas('dossier', fn ($qd) => $qd
                    ->whereHas('avocats', fn ($qa) => $qa->where('avocats.id', $avocat->id))));
        }

        $factures = Facture::query();

        if ($request->user()->hasRole('avocat') && $avocat = $request->user()->avocat) {
            $factures->whereHas('dossier', fn ($q) => $q
                ->whereHas('avocats', fn ($qa) => $qa->where('avocats.id', $avocat->id)));
        }

        return response()->json([
            'total_encaisse' => (int) (clone $paiements)->sum('montant'),
            'total_mois' => (int) (clone $paiements)
                ->whereBetween('date_paiement', [now()->startOfMonth(), now()->endOfMonth()])
                ->sum('montant'),
            'nombre' => (clone $paiements)->count(),
            'par_mode' => (clone $paiements)
                ->toBase()
                ->selectRaw('mode, COUNT(*) as nombre, COALESCE(SUM(montant), 0) as total')
                ->groupBy('mode')
                ->get()
                ->mapWithKeys(fn ($row): array => [
                    (string) $row->mode => [
                        'nombre' => (int) $row->nombre,
                        'total' => (int) $row->total,
                    ],
                ]),
            'restant_a_encaisser' => (int) (clone $factures)
                ->where('statut', '!=', 'annulee')
                ->selectRaw('factures.id, factures.montant_total, COALESCE(SUM(paiements.montant), 0) as paye')
                ->leftJoin('paiements', 'paiements.facture_id', '=', 'factures.id')
                ->groupBy('factures.id')
                ->get()
                ->sum(fn ($row): int => (int) $row->montant_total - (int) $row->paye),
        ]);
    }
}
