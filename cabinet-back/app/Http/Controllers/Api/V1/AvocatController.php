<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AvocatRequest;
use App\Http\Resources\AvocatResource;
use App\Models\Avocat;
use App\Models\User;
use App\Support\SearchFilter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;
use OpenApi\Attributes as OA;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;

class AvocatController extends Controller
{
    #[OA\Get(
        path: '/api/v1/avocats',
        summary: 'Liste des avocats',
        tags: ['Avocats'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Pagination des avocats'),
        ]
    )]
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Avocat::class);

        $query = QueryBuilder::for(Avocat::class, $request)
            ->allowedFilters(...[
                SearchFilter::partial(['nom', 'prenom', 'specialite']),
                AllowedFilter::exact('specialite'),
            ])
            ->allowedSorts(...[
                AllowedSort::field('nom'),
                AllowedSort::field('specialite'),
            ])
            ->with('user:id,name,email')
            ->withCount('dossiers')
            ->defaultSort('nom');

        return AvocatResource::collection($query->paginate($request->integer('per_page', 15)));
    }

    #[OA\Post(
        path: '/api/v1/avocats',
        summary: 'Créer un avocat (et son compte utilisateur)',
        tags: ['Avocats'],
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/Avocat')
        ),
        responses: [
            new OA\Response(response: 201, description: 'Avocat créé'),
        ]
    )]
    public function store(AvocatRequest $request): JsonResponse
    {
        $this->authorize('create', Avocat::class);

        $data = $request->validated();

        $user = User::create([
            'name' => trim($data['prenom'].' '.$data['nom']),
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);
        $user->assignRole('avocat');

        $avocat = Avocat::create([
            'user_id' => $user->id,
            'nom' => $data['nom'],
            'prenom' => $data['prenom'],
            'specialite' => $data['specialite'] ?? null,
            'telephone' => $data['telephone'] ?? null,
            'barreau' => $data['barreau'] ?? null,
            'actif' => $data['actif'] ?? true,
        ]);

        return (new AvocatResource($avocat->load('user')))
            ->response()
            ->setStatusCode(201);
    }

    #[OA\Get(
        path: '/api/v1/avocats/{avocat}',
        summary: 'Détail d\'un avocat',
        tags: ['Avocats'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'avocat', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Avocat'),
        ]
    )]
    public function show(Request $request, Avocat $avocat): AvocatResource
    {
        $this->authorize('view', $avocat);

        return new AvocatResource($avocat->load(['user', 'dossiers.client']));
    }

    #[OA\Put(
        path: '/api/v1/avocats/{avocat}',
        summary: 'Modifier un avocat',
        tags: ['Avocats'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'avocat', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/Avocat')
        ),
        responses: [
            new OA\Response(response: 200, description: 'Avocat modifié'),
        ]
    )]
    public function update(AvocatRequest $request, Avocat $avocat): AvocatResource
    {
        $this->authorize('update', $avocat);

        $data = $request->validated();
        $password = $data['password'] ?? null;
        unset($data['password'], $data['email']);

        $avocat->update($data);

        if ($password && $avocat->user) {
            $avocat->user->update(['password' => Hash::make($password)]);
        }

        return new AvocatResource($avocat->fresh()->load('user'));
    }

    #[OA\Delete(
        path: '/api/v1/avocats/{avocat}',
        summary: 'Désactiver un avocat',
        tags: ['Avocats'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'avocat', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Avocat désactivé'),
        ]
    )]
    public function destroy(Request $request, Avocat $avocat): JsonResponse
    {
        $this->authorize('delete', $avocat);

        $avocat->update(['actif' => false]);

        return response()->json(['message' => 'Avocat désactivé.']);
    }
}
