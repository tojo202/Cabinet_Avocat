<?php

namespace App\Observers;

use App\Enums\StatutDossier;
use App\Models\Dossier;

class DossierObserver
{
    /**
     * Recalcule l'avancement et la date de clôture quand le statut change.
     */
    public function saving(Dossier $dossier): void
    {
        if (! $dossier->isDirty('statut')) {
            return;
        }

        match ($dossier->statut) {
            StatutDossier::Cloture => $this->cloturer($dossier),
            StatutDossier::EnCours => $dossier->avancement = max($dossier->avancement, 10),
            StatutDossier::EnAttente => $dossier->avancement = max($dossier->avancement, 5),
            default => null,
        };
    }

    /**
     * Journalise chaque changement de statut (exigence de confidentialité).
     */
    public function saved(Dossier $dossier): void
    {
        if (! $dossier->wasChanged('statut')) {
            return;
        }

        activity('dossier')
            ->performedOn($dossier)
            ->causedBy(auth()->user())
            ->withProperties([
                'ancien_statut' => $dossier->getOriginal('statut'),
                'nouveau_statut' => $dossier->statut->value,
                'avancement' => $dossier->avancement,
            ])
            ->log('Changement de statut du dossier');
    }

    private function cloturer(Dossier $dossier): void
    {
        $dossier->avancement = 100;
        $dossier->date_cloture = $dossier->date_cloture ?? now()->toDateString();
    }
}
