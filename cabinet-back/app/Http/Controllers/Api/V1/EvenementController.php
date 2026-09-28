<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\EvenementRequest;
use App\Http\Resources\EvenementResource;
use App\Models\Evenement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use OpenApi\Attributes as OA;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;

class EvenementController extends Controller
{
    #[OA\Get(
        path: '/api/v1/evenements',
        summary: 'Liste des évènements',
        tags: ['Calendrier'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'from', in: 'query', schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'to', in: 'query', schema: new OA\Schema(type: 'string', format: 'date')),
            new OA\Parameter(name: 'type', in: 'query', schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Pagination des évènements'),
        ]
    )]
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Evenement::class);

        $query = QueryBuilder::for(Evenement::class, $request)
            ->allowedFilters(...[
                AllowedFilter::exact('type'),
            ])
            ->allowedSorts(...[
                AllowedSort::field('debut'),
                AllowedSort::field('type'),
            ])
            ->with(['dossier:id,reference,titre,statut', 'client:id,nom,prenom,raison_sociale,type_client'])
            ->defaultSort('debut');

        if ($request->filled('from')) {
            $query->where('debut', '>=', $request->date('from')->startOfDay());
        }

        if ($request->filled('to')) {
            $query->where('debut', '<=', $request->date('to')->endOfDay());
        }

        if ($request->user()->hasRole('avocat') && $avocat = $request->user()->avocat) {
            $query->where(function ($q) use ($avocat) {
                $q->whereNull('dossier_id')
                    ->orWhereHas('dossier', fn ($qd) => $qd
                        ->whereHas('avocats', fn ($qa) => $qa->where('avocats.id', $avocat->id)));
            });
        }

        return EvenementResource::collection($query->paginate($request->integer('per_page', 100)));
    }

    #[OA\Post(
        path: '/api/v1/evenements',
        summary: 'Créer un évènement',
        tags: ['Calendrier'],
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/Evenement')
        ),
        responses: [
            new OA\Response(response: 201, description: 'Évènement créé'),
        ]
    )]
    public function store(EvenementRequest $request): JsonResponse
    {
        $this->authorize('create', Evenement::class);

        $evenement = Evenement::create($request->validated());

        return (new EvenementResource($evenement->load(['dossier', 'client'])))
            ->response()
            ->setStatusCode(201);
    }

    #[OA\Get(
        path: '/api/v1/evenements/{evenement}',
        summary: 'Détail d\'un évènement',
        tags: ['Calendrier'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'evenement', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Évènement'),
        ]
    )]
    public function show(Request $request, Evenement $evenement): EvenementResource
    {
        $this->authorize('view', $evenement);

        return new EvenementResource($evenement->load(['dossier', 'client']));
    }

    #[OA\Put(
        path: '/api/v1/evenements/{evenement}',
        summary: 'Modifier un évènement',
        tags: ['Calendrier'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'evenement', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/Evenement')
        ),
        responses: [
            new OA\Response(response: 200, description: 'Évènement modifié'),
        ]
    )]
    public function update(EvenementRequest $request, Evenement $evenement): EvenementResource
    {
        $this->authorize('update', $evenement);

        $evenement->update($request->validated());

        return new EvenementResource($evenement->fresh()->load(['dossier', 'client']));
    }

    #[OA\Delete(
        path: '/api/v1/evenements/{evenement}',
        summary: 'Supprimer un évènement',
        tags: ['Calendrier'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'evenement', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 204, description: 'Évènement supprimé'),
        ]
    )]
    public function destroy(Request $request, Evenement $evenement): JsonResponse
    {
        $this->authorize('delete', $evenement);

        $evenement->delete();

        return response()->json(null, 204);
    }
}
