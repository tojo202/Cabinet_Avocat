<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\SearchFilter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;

class UserController extends Controller
{
    #[OA\Get(
        path: '/api/v1/users',
        summary: 'Liste des utilisateurs',
        tags: ['Utilisateurs'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'filter[role]', in: 'query', schema: new OA\Schema(type: 'string', enum: ['admin', 'avocat', 'secretaire', 'comptable'])),
            new OA\Parameter(name: 'filter[search]', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'sort', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'page', in: 'query', schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Pagination des utilisateurs'),
            new OA\Response(response: 403, description: 'Droit « utilisateurs.manage » requis'),
        ]
    )]
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', User::class);

        $query = QueryBuilder::for(User::class, $request)
            ->allowedFilters(...[
                AllowedFilter::callback('role', function ($query, $value): void {
                    $query->role($value);
                }),
                SearchFilter::partial(['name', 'email']),
            ])
            ->allowedSorts(...[
                AllowedSort::field('name'),
                AllowedSort::field('email'),
                AllowedSort::field('created_at'),
            ])
            ->with('roles')
            ->defaultSort('-created_at');

        return UserResource::collection($query->paginate($request->integer('per_page', 15)));
    }

    #[OA\Post(
        path: '/api/v1/users',
        summary: 'Créer un utilisateur',
        tags: ['Utilisateurs'],
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/Utilisateur')
        ),
        responses: [
            new OA\Response(response: 201, description: 'Utilisateur créé'),
            new OA\Response(response: 403, description: 'Droit « utilisateurs.manage » requis'),
            new OA\Response(response: 422, description: 'Données invalides'),
        ]
    )]
    public function store(UserRequest $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        $user->assignRole($data['role']);

        return (new UserResource($user->load('roles')))
            ->response()
            ->setStatusCode(201);
    }

    #[OA\Get(
        path: '/api/v1/users/{user}',
        summary: 'Détail d\'un utilisateur',
        tags: ['Utilisateurs'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'user', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Utilisateur'),
            new OA\Response(response: 403, description: 'Droit « utilisateurs.manage » requis'),
        ]
    )]
    public function show(Request $request, User $user): UserResource
    {
        $this->authorize('view', $user);

        return new UserResource($user->load('roles'));
    }

    #[OA\Patch(
        path: '/api/v1/users/{user}',
        summary: 'Modifier un utilisateur',
        tags: ['Utilisateurs'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'user', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/Utilisateur')
        ),
        responses: [
            new OA\Response(response: 200, description: 'Utilisateur modifié'),
            new OA\Response(response: 403, description: 'Droit « utilisateurs.manage » requis'),
            new OA\Response(response: 422, description: 'Données invalides'),
        ]
    )]
    public function update(UserRequest $request, User $user): UserResource
    {
        $this->authorize('update', $user);

        $data = $request->validated();
        $roleActuel = $user->getRoleNames()->first();

        if ($user->id === $request->user()->id && $data['role'] !== $roleActuel) {
            throw ValidationException::withMessages([
                'role' => 'Impossible de modifier votre propre rôle.',
            ]);
        }

        $attributs = [
            'name' => $data['name'],
            'email' => $data['email'],
        ];

        if (! empty($data['password'])) {
            $attributs['password'] = $data['password'];
        }

        $user->update($attributs);

        if ($data['role'] !== $roleActuel) {
            $user->syncRoles([$data['role']]);
        }

        return new UserResource($user->fresh()->load('roles'));
    }

    #[OA\Delete(
        path: '/api/v1/users/{user}',
        summary: 'Supprimer un utilisateur',
        tags: ['Utilisateurs'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'user', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 204, description: 'Utilisateur supprimé'),
            new OA\Response(response: 403, description: 'Droit « utilisateurs.manage » requis'),
            new OA\Response(response: 422, description: 'Suppression impossible'),
        ]
    )]
    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        if ($user->id === $request->user()->id) {
            throw ValidationException::withMessages([
                'user' => 'Impossible de supprimer votre propre compte.',
            ]);
        }

        if ($user->hasRole('admin') && User::role('admin')->count() <= 1) {
            throw ValidationException::withMessages([
                'user' => 'Impossible de supprimer le dernier administrateur.',
            ]);
        }

        $user->delete();

        return response()->json(null, 204);
    }
}
