<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\StatutDossier;
use App\Enums\TypeEvenement;
use App\Http\Controllers\Controller;
use App\Http\Resources\DossierResource;
use App\Models\Client;
use App\Models\Document;
use App\Models\Dossier;
use App\Models\Evenement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use OpenApi\Attributes as OA;

class DashboardController extends Controller
{
    #[OA\Get(
        path: '/api/v1/dashboard/stats',
        summary: 'KPI du tableau de bord',
        tags: ['Dashboard'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Statistiques'),
        ]
    )]
    public function stats(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('dashboard.view'), 403);

        $totalClients = Client::count();
        $nouveauxMois = Client::whereBetween('created_at', [now()->startOfMonth(), now()])->count();
        $clientsActifs = Client::where('actif', true)->count();

        return response()->json([
            'clients_actifs' => $clientsActifs,
            'clients_nouveaux_pct' => $totalClients > 0
                ? round($nouveauxMois / $totalClients * 100, 1)
                : 0,
            'dossiers_en_cours' => Dossier::where('statut', StatutDossier::EnCours->value)->count(),
            'dossiers_urgents' => Dossier::where('priorite', 'urgente')
                ->where('statut', '!=', StatutDossier::Cloture->value)
                ->count(),
            'total_documents' => Document::count(),
        ]);
    }

    #[OA\Get(
        path: '/api/v1/dashboard/activite',
        summary: 'Activité sur 7 jours (dossiers ouverts + rendez-vous)',
        tags: ['Dashboard'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Série temporelle pour Recharts'),
        ]
    )]
    public function activite(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('dashboard.view'), 403);

        $jours = collect(range(6, 0))->map(fn (int $offset): array => [
            'date' => Carbon::now()->subDays($offset)->toDateString(),
            'dossiers_ouverts' => Dossier::whereDate('date_ouverture', Carbon::now()->subDays($offset)->toDateString())->count(),
            'rendez_vous' => Evenement::where('type', TypeEvenement::RendezVous->value)
                ->whereDate('debut', Carbon::now()->subDays($offset)->toDateString())
                ->count(),
            'audiences' => Evenement::where('type', TypeEvenement::Audience->value)
                ->whereDate('debut', Carbon::now()->subDays($offset)->toDateString())
                ->count(),
        ]);

        return response()->json($jours->values());
    }

    #[OA\Get(
        path: '/api/v1/dashboard/dossiers-recents',
        summary: '5 derniers dossiers',
        tags: ['Dashboard'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Dossiers récents'),
        ]
    )]
    public function dossiersRecents(Request $request)
    {
        abort_unless($request->user()->can('dashboard.view'), 403);

        $query = Dossier::with(['client:id,nom,prenom,raison_sociale,type_client', 'avocats:id,nom,prenom'])
            ->latest()->take(5);

        if ($request->user()->hasRole('avocat') && $avocat = $request->user()->avocat) {
            $query->whereHas('avocats', fn ($q) => $q->where('avocats.id', $avocat->id));
        }

        return DossierResource::collection($query->get());
    }
}
