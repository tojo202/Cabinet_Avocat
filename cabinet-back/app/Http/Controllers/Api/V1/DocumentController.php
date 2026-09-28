<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\DocumentRequest;
use App\Http\Resources\CategorieDocumentResource;
use App\Http\Resources\DocumentResource;
use App\Models\CategorieDocument;
use App\Models\Document;
use App\Support\SearchFilter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use OpenApi\Attributes as OA;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\AllowedSort;
use Spatie\QueryBuilder\QueryBuilder;

class DocumentController extends Controller
{
    #[OA\Get(
        path: '/api/v1/documents',
        summary: 'Liste des documents',
        tags: ['Documents'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'search', in: 'query', schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'categorie_document_id', in: 'query', schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Pagination des documents'),
        ]
    )]
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Document::class);

        $query = QueryBuilder::for(Document::class, $request)
            ->allowedFilters(...[
                AllowedFilter::exact('categorie_document_id'),
                AllowedFilter::exact('dossier_id'),
                SearchFilter::partial(['nom']),
            ])
            ->allowedSorts(...[
                AllowedSort::field('created_at'),
                AllowedSort::field('taille'),
                AllowedSort::field('nom'),
            ])
            ->with(['dossier:id,reference,titre', 'categorie'])
            ->defaultSort('-created_at');

        if ($request->user()->hasRole('avocat') && $avocat = $request->user()->avocat) {
            $query->whereHas('dossier', fn ($q) => $q
                ->whereHas('avocats', fn ($qa) => $qa->where('avocats.id', $avocat->id)));
        }

        return DocumentResource::collection($query->paginate($request->integer('per_page', 15)));
    }

    #[OA\Get(
        path: '/api/v1/documents/stats',
        summary: 'Statistiques documents',
        tags: ['Documents'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Statistiques'),
        ]
    )]
    public function stats(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Document::class);

        $query = Document::query();

        if ($request->user()->hasRole('avocat') && $avocat = $request->user()->avocat) {
            $query->whereHas('dossier', fn ($q) => $q
                ->whereHas('avocats', fn ($qa) => $qa->where('avocats.id', $avocat->id)));
        }

        $quota = 5 * 1024 * 1024 * 1024;

        return response()->json([
            'total_documents' => (clone $query)->count(),
            'espace_utilise' => (int) (clone $query)->sum('taille'),
            'quota' => $quota,
            'dossiers_lies' => (clone $query)->whereNotNull('dossier_id')->distinct()->count('dossier_id'),
            'categories' => CategorieDocumentResource::collection(
                CategorieDocument::withCount('documents')->get()
            ),
        ]);
    }

    #[OA\Post(
        path: '/api/v1/documents',
        summary: 'Uploader un document (stockage privé)',
        tags: ['Documents'],
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    properties: [
                        new OA\Property(property: 'file', type: 'string', format: 'binary'),
                        new OA\Property(property: 'dossier_id', type: 'integer'),
                        new OA\Property(property: 'categorie_document_id', type: 'integer'),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Document uploadé'),
        ]
    )]
    public function store(DocumentRequest $request): JsonResponse
    {
        $this->authorize('create', Document::class);

        $fichier = $request->file('file');
        $chemin = $fichier->store('documents', 'local');

        $document = Document::create([
            'dossier_id' => $request->input('dossier_id'),
            'categorie_document_id' => $request->input('categorie_document_id'),
            'user_id' => $request->user()->id,
            'nom' => $fichier->getClientOriginalName(),
            'path' => $chemin,
            'mime_type' => $fichier->getMimeType(),
            'taille' => $fichier->getSize(),
        ]);

        return (new DocumentResource($document->load(['dossier', 'categorie'])))
            ->response()
            ->setStatusCode(201);
    }

    #[OA\Get(
        path: '/api/v1/documents/{document}',
        summary: 'Détail d\'un document',
        tags: ['Documents'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'document', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Document'),
        ]
    )]
    public function show(Request $request, Document $document): DocumentResource
    {
        $this->authorize('view', $document);

        return new DocumentResource($document->load(['dossier', 'categorie']));
    }

    #[OA\Delete(
        path: '/api/v1/documents/{document}',
        summary: 'Supprimer un document',
        tags: ['Documents'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'document', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 204, description: 'Document supprimé'),
        ]
    )]
    public function destroy(Request $request, Document $document): JsonResponse
    {
        $this->authorize('delete', $document);

        Storage::disk('local')->delete($document->path);
        $document->delete();

        return response()->json(null, 204);
    }

    #[OA\Get(
        path: '/api/v1/documents/{document}/download',
        summary: 'Télécharger un document (vérifie la policy)',
        tags: ['Documents'],
        security: [['sanctum' => []]],
        parameters: [
            new OA\Parameter(name: 'document', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Fichier'),
        ]
    )]
    public function download(Request $request, Document $document)
    {
        $this->authorize('download', $document);

        abort_unless(Storage::disk('local')->exists($document->path), 404);

        return Storage::disk('local')->download($document->path, $document->nom);
    }
}
