<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\GenererNumeroFacture;
use App\Enums\StatutFacture;
use App\Http\Controllers\Controller;
use App\Http\Requests\FactureRequest;
use App\Http\Requests\PaiementRequest;
use App\Http\Resources\FactureResource;
use App\Models\Facture;
use App\Support\SearchFilter;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use OpenApi\Attributes as OA;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;

class FactureController extends Controller
{
    #[OA\Get(
        path: '/api/v1/factures',
        summary: 'Liste des factures',
        tags: ['Facturation'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'statut', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'client_id', in: 'query', schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Pagination des factures'),
        ]
    )]
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Facture::class);

        $query = QueryBuilder::for(Facture::class, $request)
            ->allowedFilters(...[
                AllowedFilter::exact('statut'),
                AllowedFilter::exact('client_id'),
                AllowedFilter::exact('dossier_id'),
                SearchFilter::partial(['numero']),
            ])
            ->allowedSorts(...[
                AllowedSort::field('date_facture'),
                AllowedSort::field('date_echeance'),
                AllowedSort::field('montant_total'),
                AllowedSort::field('numero'),
            ])
            ->with(['client:id,nom,prenom,raison_sociale,type_client', 'dossier:id,reference,titre'])
            ->defaultSort('-date_facture');

        if ($request->user()->hasRole('avocat') && $avocat = $request->user()->avocat) {
            $query->whereHas('dossier', fn ($q) => $q
                ->whereHas('avocats', fn ($qa) => $qa->where('avocats.id', $avocat->id)));
        }

        return FactureResource::collection($query->paginate($request->integer('per_page', 15)));
    }

    #[OA\Get(
        path: '/api/v1/factures/stats',
        summary: 'Statistiques de facturation',
        tags: ['Facturation'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Statistiques'),
        ]
    )]
    public function stats(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Facture::class);

        $query = Facture::query();

        if ($request->user()->hasRole('avocat') && $avocat = $request->user()->avocat) {
            $query->whereHas('dossier', fn ($q) => $q
                ->whereHas('avocats', fn ($qa) => $qa->where('avocats.id', $avocat->id)));
        }

        $payee = (clone $query)->where('statut', StatutFacture::Payee->value);
        $enAttente = (clone $query)->where('statut', StatutFacture::EnAttente->value);
        $enRetard = (clone $query)
            ->where('statut', StatutFacture::EnAttente->value)
            ->where('date_echeance', '<', now()->toDateString());

        return response()->json([
            'paye' => (int) $payee->sum('montant_total'),
            'en_attente' => (int) $enAttente->sum('montant_total'),
            'en_retard' => (int) $enRetard->sum('montant_total'),
            'total_factures' => (clone $query)->count(),
            'total_toutes' => (int) (clone $query)->sum('montant_total'),
        ]);
    }

    #[OA\Post(
        path: '/api/v1/factures',
        summary: 'Créer une facture avec ses lignes',
        tags: ['Facturation'],
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/Facture')
        ),
        responses: [
            new OA\Response(response: 201, description: 'Facture créée'),
        ]
    )]
    public function store(FactureRequest $request, GenererNumeroFacture $action): JsonResponse
    {
        $this->authorize('create', Facture::class);

        $data = $request->validated();
        $lignes = $data['lignes'];
        unset($data['lignes']);

        $facture = DB::transaction(function () use ($data, $lignes, $action) {
            $data['numero'] = $action->execute();
            $data['statut'] ??= StatutFacture::Brouillon->value;
            $data['montant_total'] = collect($lignes)->sum(
                fn (array $ligne): int => $ligne['quantite'] * $ligne['prix_unitaire']
            );

            $facture = Facture::create($data);

            foreach ($lignes as $ligne) {
                $facture->lignes()->create($ligne + [
                    'montant' => $ligne['quantite'] * $ligne['prix_unitaire'],
                ]);
            }

            return $facture;
        });

        return (new FactureResource($facture->load(['client', 'dossier', 'lignes', 'paiements'])))
            ->response()
            ->setStatusCode(201);
    }

    #[OA\Get(
        path: '/api/v1/factures/{facture}',
        summary: 'Détail d\'une facture',
        tags: ['Facturation'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'facture', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Facture'),
        ]
    )]
    public function show(Request $request, Facture $facture): FactureResource
    {
        $this->authorize('view', $facture);

        return new FactureResource($facture->load(['client', 'dossier', 'lignes', 'paiements']));
    }

    #[OA\Put(
        path: '/api/v1/factures/{facture}',
        summary: 'Modifier une facture',
        tags: ['Facturation'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'facture', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/Facture')
        ),
        responses: [
            new OA\Response(response: 200, description: 'Facture modifiée'),
        ]
    )]
    public function update(FactureRequest $request, Facture $facture): FactureResource
    {
        $this->authorize('update', $facture);

        $data = $request->validated();
        $lignes = $data['lignes'] ?? null;
        unset($data['lignes'], $data['numero']);

        DB::transaction(function () use ($data, $lignes, $facture) {
            if ($lignes !== null) {
                $data['montant_total'] = collect($lignes)->sum(
                    fn (array $ligne): int => $ligne['quantite'] * $ligne['prix_unitaire']
                );
            }

            $facture->update($data);

            if ($lignes !== null) {
                $facture->lignes()->delete();
                foreach ($lignes as $ligne) {
                    $facture->lignes()->create($ligne + [
                        'montant' => $ligne['quantite'] * $ligne['prix_unitaire'],
                    ]);
                }
            }
        });

        return new FactureResource($facture->fresh()->load(['client', 'dossier', 'lignes', 'paiements']));
    }

    #[OA\Delete(
        path: '/api/v1/factures/{facture}',
        summary: 'Supprimer une facture',
        tags: ['Facturation'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'facture', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 204, description: 'Facture supprimée'),
        ]
    )]
    public function destroy(Request $request, Facture $facture): JsonResponse
    {
        $this->authorize('delete', $facture);

        DB::transaction(function () use ($facture) {
            $facture->paiements()->delete();
            $facture->delete();
        });

        return response()->json(null, 204);
    }

    #[OA\Post(
        path: '/api/v1/factures/{facture}/paiements',
        summary: 'Enregistrer un paiement',
        tags: ['Facturation'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'facture', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/Paiement')
        ),
        responses: [
            new OA\Response(response: 201, description: 'Paiement enregistré'),
            new OA\Response(response: 422, description: 'Montant supérieur au solde'),
        ]
    )]
    public function ajouterPaiement(PaiementRequest $request, Facture $facture): JsonResponse
    {
        $this->authorize('addPaiement', $facture);

        $data = $request->validated();

        if ($data['montant'] > $facture->solde) {
            return response()->json([
                'message' => 'Le montant dépasse le solde restant.',
            ], 422);
        }

        $paiement = $facture->paiements()->create($data);

        if ($facture->solde <= 0 && $facture->statut !== StatutFacture::Annulee) {
            $facture->update(['statut' => StatutFacture::Payee]);
        }

        return response()->json([
            'paiement' => $paiement,
            'facture' => new FactureResource($facture->fresh()->load(['client', 'lignes', 'paiements'])),
        ], 201);
    }

    #[OA\Get(
        path: '/api/v1/factures/{facture}/pdf',
        summary: 'Télécharger le PDF d\'une facture',
        tags: ['Facturation'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'facture', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Fichier PDF'),
        ]
    )]
    public function pdf(Request $request, Facture $facture)
    {
        $this->authorize('pdf', $facture);

        $facture->load(['client', 'dossier', 'lignes', 'paiements']);

        $pdf = Pdf::loadView('factures.pdf', ['facture' => $facture]);

        return $pdf->download($facture->numero.'.pdf');
    }
}
