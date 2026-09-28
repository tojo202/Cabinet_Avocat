<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use App\Support\SearchFilter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use OpenApi\Attributes as OA;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;

class ClientController extends Controller
{
    #[OA\Get(
        path: '/api/v1/clients',
        summary: 'Liste des clients',
        tags: ['Clients'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'type', in: 'query', schema: new OA\Schema(type: 'string', enum: ['particulier', 'societe'])),
            new OA\Parameter(name: 'search', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'sort', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Pagination des clients'),
        ]
    )]
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Client::class);

        $query = QueryBuilder::for(Client::class, $request)
            ->allowedFilters(...[
                AllowedFilter::exact('type', 'type_client'),
                SearchFilter::partial(['nom', 'prenom', 'raison_sociale', 'email', 'telephone']),
            ])
            ->allowedSorts(...[
                AllowedSort::field('nom'),
                AllowedSort::field('type_client'),
                AllowedSort::field('created_at'),
            ])
            ->withCount('dossiers')
            ->defaultSort('-created_at');

        if ($request->user()->hasRole('avocat') && $avocat = $request->user()->avocat) {
            $query->whereHas('dossiers', fn ($q) => $q
                ->whereHas('avocats', fn ($qa) => $qa->where('avocats.id', $avocat->id)));
        }

        return ClientResource::collection($query->paginate($request->integer('per_page', 15)));
    }

    #[OA\Get(
        path: '/api/v1/clients/stats',
        summary: 'Statistiques clients',
        tags: ['Clients'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Statistiques'),
        ]
    )]
    public function stats(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Client::class);

        return response()->json([
            'total' => Client::count(),
            'particuliers' => Client::where('type_client', 'particulier')->count(),
            'societes' => Client::where('type_client', 'societe')->count(),
            'nouveaux_ce_mois' => Client::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
        ]);
    }

    #[OA\Post(
        path: '/api/v1/clients',
        summary: 'Créer un client',
        tags: ['Clients'],
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/Client')
        ),
        responses: [
            new OA\Response(response: 201, description: 'Client créé'),
        ]
    )]
    public function store(ClientRequest $request): JsonResponse
    {
        $this->authorize('create', Client::class);

        $client = Client::create($request->validated());

        return (new ClientResource($client->loadCount('dossiers')))
            ->response()
            ->setStatusCode(201);
    }

    #[OA\Get(
        path: '/api/v1/clients/{client}',
        summary: 'Détail d\'un client',
        tags: ['Clients'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'client', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Client'),
        ]
    )]
    public function show(Request $request, Client $client): ClientResource
    {
        $this->authorize('view', $client);

        return new ClientResource($client->load(['dossiers', 'factures']));
    }

    #[OA\Put(
        path: '/api/v1/clients/{client}',
        summary: 'Modifier un client',
        tags: ['Clients'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'client', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/Client')
        ),
        responses: [
            new OA\Response(response: 200, description: 'Client modifié'),
        ]
    )]
    public function update(ClientRequest $request, Client $client): ClientResource
    {
        $this->authorize('update', $client);

        $client->update($request->validated());

        return new ClientResource($client->fresh()->loadCount('dossiers'));
    }

    #[OA\Delete(
        path: '/api/v1/clients/{client}',
        summary: 'Supprimer un client',
        tags: ['Clients'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'client', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 204, description: 'Client supprimé'),
        ]
    )]
    public function destroy(Request $request, Client $client): JsonResponse
    {
        $this->authorize('delete', $client);

        $client->delete();

        return response()->json(null, 204);
    }

    #[OA\Get(
        path: '/api/v1/clients/export',
        summary: 'Export CSV des clients',
        tags: ['Clients'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Fichier CSV'),
        ]
    )]
    public function export(Request $request): Response
    {
        $this->authorize('export', Client::class);

        $clients = Client::orderBy('id')->get();

        $handle = fopen('php://temp', 'r+');
        fputcsv($handle, ['ID', 'Type', 'Nom', 'Prénom', 'Raison sociale', 'Email', 'Téléphone', 'Adresse', 'NIF', 'STAT', 'Créé le']);

        foreach ($clients as $client) {
            fputcsv($handle, [
                $client->id,
                $client->type_client->value,
                $client->nom,
                $client->prenom,
                $client->raison_sociale,
                $client->email,
                $client->telephone,
                $client->adresse,
                $client->nif,
                $client->stat,
                $client->created_at?->format('d/m/Y'),
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="clients-'.now()->format('Ymd').'.csv"',
        ]);
    }
}
