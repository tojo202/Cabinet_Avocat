<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PrioriteDossier;
use App\Enums\StatutDossier;
use App\Enums\StatutFacture;
use App\Http\Controllers\Controller;
use App\Models\Dossier;
use App\Models\Evenement;
use App\Models\Facture;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class NotificationController extends Controller
{
    /**
     * Ordre d'affichage des alertes par criticité décroissante.
     *
     * @var array<string, int>
     */
    private const ORDRE_CRITICITE = ['haute' => 0, 'moyenne' => 1, 'info' => 2];

    #[OA\Get(
        path: '/api/v1/notifications',
        summary: 'Centre de notifications (alertes métier)',
        tags: ['Notifications'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Alertes de l\'utilisateur courant'),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $notifications = [
            ...$this->facturesEnRetard($user),
            ...$this->dossiersUrgents($user),
            ...$this->evenementsDuJour($user),
        ];

        usort($notifications, fn (array $a, array $b): int => self::ORDRE_CRITICITE[$a['criticite']] <=> self::ORDRE_CRITICITE[$b['criticite']]);

        $notifications = array_slice($notifications, 0, 12);

        return response()->json([
            'data' => $notifications,
            'total' => count($notifications),
        ]);
    }

    /**
     * Factures en attente dont l'échéance est dépassée.
     *
     * @return array<int, array<string, mixed>>
     */
    private function facturesEnRetard(User $user): array
    {
        if (! $user->can('factures.view')) {
            return [];
        }

        $query = Facture::query()
            ->where('statut', StatutFacture::EnAttente->value)
            ->whereDate('date_echeance', '<', now()->toDateString())
            ->with('client:id,type_client,nom,prenom,raison_sociale')
            ->orderBy('date_echeance')
            ->limit(5);

        if ($user->hasRole('avocat') && $avocat = $user->avocat) {
            $query->whereHas('dossier', fn (Builder $q) => $q
                ->whereHas('avocats', fn (Builder $qa) => $qa->where('avocats.id', $avocat->id)));
        }

        return $query->get()->map(fn (Facture $facture): array => [
            'id' => 'facture_retard:'.$facture->id,
            'type' => 'facture_retard',
            'criticite' => 'haute',
            'titre' => 'Facture en retard',
            'message' => $facture->numero.' • '.($facture->client?->nomComplet ?? 'Client')
                .' • '.number_format((int) $facture->montant_total, 0, ',', ' ').' Ar',
            'lien' => '/facturation',
            'date' => $facture->date_echeance?->toDateString(),
        ])->all();
    }

    /**
     * Dossiers de priorité urgente encore ouverts.
     *
     * @return array<int, array<string, mixed>>
     */
    private function dossiersUrgents(User $user): array
    {
        if (! $user->can('dossiers.view')) {
            return [];
        }

        $query = Dossier::query()
            ->where('priorite', PrioriteDossier::Urgente->value)
            ->where('statut', '!=', StatutDossier::Cloture->value)
            ->latest('date_ouverture')
            ->limit(5);

        if ($user->hasRole('avocat') && $avocat = $user->avocat) {
            $query->whereHas('avocats', fn (Builder $q) => $q->where('avocats.id', $avocat->id));
        }

        return $query->get()->map(fn (Dossier $dossier): array => [
            'id' => 'dossier_urgent:'.$dossier->id,
            'type' => 'dossier_urgent',
            'criticite' => 'moyenne',
            'titre' => 'Dossier urgent',
            'message' => $dossier->reference.' • '.$dossier->titre,
            'lien' => '/dossiers',
            'date' => $dossier->date_ouverture?->toDateString(),
        ])->all();
    }

    /**
     * Événements (audiences, rendez-vous...) prévus aujourd'hui.
     *
     * @return array<int, array<string, mixed>>
     */
    private function evenementsDuJour(User $user): array
    {
        if (! $user->can('evenements.view')) {
            return [];
        }

        $query = Evenement::query()
            ->whereDate('debut', now()->toDateString())
            ->orderBy('debut')
            ->limit(5);

        if ($user->hasRole('avocat') && $avocat = $user->avocat) {
            $query->where(function (Builder $q) use ($avocat) {
                $q->whereNull('dossier_id')
                    ->orWhereHas('dossier', fn (Builder $qd) => $qd
                        ->whereHas('avocats', fn (Builder $qa) => $qa->where('avocats.id', $avocat->id)));
            });
        }

        return $query->get()->map(fn (Evenement $evenement): array => [
            'id' => 'evenement_jour:'.$evenement->id,
            'type' => 'evenement_jour',
            'criticite' => 'info',
            'titre' => 'Événement aujourd\'hui',
            'message' => $evenement->debut?->format('H:i').' • '.$evenement->titre,
            'lien' => '/calendrier',
            'date' => $evenement->debut?->toDateString(),
        ])->all();
    }
}
