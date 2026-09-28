<?php

namespace App\Http\Controllers\Api\V1;

use App\Actions\GenererNumeroDossier;
use App\Enums\PrioriteDossier;
use App\Enums\StatutDossier;
use App\Http\Controllers\Controller;
use App\Http\Requests\DossierRequest;
use App\Http\Resources\ActivityResource;
use App\Http\Resources\DossierResource;
use App\Models\Dossier;
use App\Support\SearchFilter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;

class DossierController extends Controller
{
    #[OA\Get(
        path: '/api/v1/dossiers',
        summary: 'Liste des dossiers',
        tags: ['Dossiers'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'statut', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'type_droit', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'priorite', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'search', in: 'query', schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Pagination des dossiers'),
        ]
    )]
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Dossier::class);

        $query = QueryBuilder::for(Dossier::class, $request)
            ->allowedFilters(...[
                AllowedFilter::exact('statut'),
                AllowedFilter::exact('type_droit'),
                AllowedFilter::exact('priorite'),
                SearchFilter::partial(['reference', 'titre']),
            ])
            ->allowedSorts(...[
                AllowedSort::field('reference'),
                AllowedSort::field('date_ouverture'),
                AllowedSort::field('avancement'),
                AllowedSort::field('montant'),
            ])
            ->with(['client', 'avocats'])
            ->defaultSort('-created_at');

        if ($request->user()->hasRole('avocat') && $avocat = $request->user()->avocat) {
            $query->whereHas('avocats', fn ($q) => $q->where('avocats.id', $avocat->id));
        }

        return DossierResource::collection($query->paginate($request->integer('per_page', 15)));
    }

    #[OA\Get(
        path: '/api/v1/dossiers/stats',
        summary: 'Statistiques des dossiers',
        tags: ['Dossiers'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Statistiques'),
        ]
    )]
    public function stats(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Dossier::class);

        $query = Dossier::query();

        if ($request->user()->hasRole('avocat') && $avocat = $request->user()->avocat) {
            $query->whereHas('avocats', fn ($q) => $q->where('avocats.id', $avocat->id));
        }

        return response()->json([
            'total' => (clone $query)->count(),
            'en_cours' => (clone $query)->where('statut', StatutDossier::EnCours->value)->count(),
            'urgents' => (clone $query)->where('priorite', 'urgente')->count(),
            'en_revision' => (clone $query)->where('statut', StatutDossier::EnRevision->value)->count(),
            'en_attente' => (clone $query)->where('statut', StatutDossier::EnAttente->value)->count(),
            'clotures' => (clone $query)->where('statut', StatutDossier::Cloture->value)->count(),
        ]);
    }

    #[OA\Post(
        path: '/api/v1/dossiers',
        summary: 'Créer un dossier',
        tags: ['Dossiers'],
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/Dossier')
        ),
        responses: [
            new OA\Response(response: 201, description: 'Dossier créé'),
        ]
    )]
    public function store(DossierRequest $request, GenererNumeroDossier $action): JsonResponse
    {
        $this->authorize('create', Dossier::class);

        $data = $request->validated();
        $avocatIds = $data['avocat_ids'] ?? [];
        unset($data['avocat_ids']);

        $data['reference'] = $action->execute();
        $data['statut'] ??= StatutDossier::EnCours->value;
        $data['priorite'] ??= PrioriteDossier::Normale->value;
        $dossier = Dossier::create($data);
        $dossier->avocats()->sync($avocatIds);

        return (new DossierResource($dossier->load(['client', 'avocats'])))
            ->response()
            ->setStatusCode(201);
    }

    #[OA\Get(
        path: '/api/v1/dossiers/{dossier}',
        summary: 'Détail d\'un dossier',
        tags: ['Dossiers'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'dossier', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Dossier'),
        ]
    )]
    public function show(Request $request, Dossier $dossier): DossierResource
    {
        $this->authorize('view', $dossier);

        return new DossierResource($dossier->load([
            'client', 'avocats', 'documents.categorie', 'factures', 'evenements',
        ]));
    }

    #[OA\Put(
        path: '/api/v1/dossiers/{dossier}',
        summary: 'Modifier un dossier',
        tags: ['Dossiers'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'dossier', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/Dossier')
        ),
        responses: [
            new OA\Response(response: 200, description: 'Dossier modifié'),
        ]
    )]
    public function update(DossierRequest $request, Dossier $dossier): DossierResource
    {
        $this->authorize('update', $dossier);

        $data = $request->validated();
        $avocatIds = $data['avocat_ids'] ?? null;
        unset($data['avocat_ids'], $data['reference']);

        $dossier->update($data);

        if ($avocatIds !== null) {
            $dossier->avocats()->sync($avocatIds);
        }

        return new DossierResource($dossier->fresh()->load(['client', 'avocats']));
    }

    #[OA\Delete(
        path: '/api/v1/dossiers/{dossier}',
        summary: 'Supprimer un dossier',
        tags: ['Dossiers'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'dossier', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 204, description: 'Dossier supprimé'),
        ]
    )]
    public function destroy(Request $request, Dossier $dossier): JsonResponse
    {
        $this->authorize('delete', $dossier);

        $dossier->delete();

        return response()->json(null, 204);
    }

    #[OA\Patch(
        path: '/api/v1/dossiers/{dossier}/statut',
        summary: 'Changer le statut d\'un dossier',
        tags: ['Dossiers'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'dossier', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['statut'],
                properties: [
                    new OA\Property(property: 'statut', type: 'string', enum: ['en_cours', 'en_revision', 'en_attente', 'cloture']),
                    new OA\Property(property: 'avancement', type: 'integer'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Dossier mis à jour'),
        ]
    )]
    public function changerStatut(Request $request, Dossier $dossier): DossierResource
    {
        $this->authorize('manageStatut', $dossier);

        $data = $request->validate([
            'statut' => ['required', Rule::enum(StatutDossier::class)],
            'avancement' => ['sometimes', 'integer', 'min:0', 'max:100'],
        ]);

        if ($data['statut'] === StatutDossier::Cloture->value) {
            $data['avancement'] = 100;
            $data['date_cloture'] = now()->toDateString();
        }

        $dossier->update($data);

        return new DossierResource($dossier->fresh()->load(['client', 'avocats']));
    }

    #[OA\Post(
        path: '/api/v1/dossiers/{dossier}/avocats',
        summary: 'Attacher ou détacher des avocats',
        tags: ['Dossiers'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'dossier', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['avocat_ids'],
                properties: [
                    new OA\Property(property: 'avocat_ids', type: 'array', items: new OA\Items(type: 'integer')),
                    new OA\Property(property: 'roles', type: 'array', items: new OA\Items(type: 'string')),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Avocats synchronisés'),
        ]
    )]
    public function synchroniserAvocats(Request $request, Dossier $dossier): DossierResource
    {
        $this->authorize('assignAvocats', $dossier);

        $data = $request->validate([
            'avocat_ids' => ['required', 'array'],
            'avocat_ids.*' => ['integer', 'exists:avocats,id'],
            'roles' => ['sometimes', 'array'],
        ]);

        $sync = [];
        foreach ($data['avocat_ids'] as $index => $avocatId) {
            $sync[$avocatId] = [
                'role' => $data['roles'][$index] ?? ($index === 0 ? 'principal' : 'collaborateur'),
            ];
        }

        $dossier->avocats()->sync($sync);

        return new DossierResource($dossier->fresh()->load(['client', 'avocats']));
    }

    #[OA\Get(
        path: '/api/v1/dossiers/{dossier}/activites',
        summary: 'Historique / audit d\'un dossier',
        tags: ['Dossiers'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'dossier', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Journal d\'audit'),
        ]
    )]
    public function activites(Request $request, Dossier $dossier)
    {
        $this->authorize('view', $dossier);

        return ActivityResource::collection(
            $dossier->activities()->latest()->take(50)->get()
        );
    }
}
