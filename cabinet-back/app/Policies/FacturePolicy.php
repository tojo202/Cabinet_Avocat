<?php

namespace App\Policies;

use App\Models\Facture;
use App\Models\User;

class FacturePolicy
{
    public function viewAny(User $user): bool
    {
        if ($user->hasRole('secretaire')) {
            return false;
        }

        return $user->can('factures.view');
    }

    public function view(User $user, Facture $facture): bool
    {
        if ($user->hasRole('secretaire')) {
            return false;
        }

        if ($user->hasRole('avocat')) {
            if (! $avocat = $user->avocat) {
                return false;
            }

            if (! $facture->dossier_id) {
                return false;
            }

            return $facture->dossier()
                ->whereHas('avocats', fn ($q) => $q->where('avocats.id', $avocat->id))
                ->exists();
        }

        return $user->can('factures.view');
    }

    public function create(User $user): bool
    {
        return $user->can('factures.manage');
    }

    public function update(User $user, Facture $facture): bool
    {
        return $user->can('factures.manage');
    }

    public function delete(User $user, Facture $facture): bool
    {
        return $user->hasRole('admin');
    }

    public function addPaiement(User $user, Facture $facture): bool
    {
        return $user->can('paiements.manage');
    }

    public function pdf(User $user, Facture $facture): bool
    {
        return $this->view($user, $facture);
    }

    public function restore(User $user, Facture $facture): bool
    {
        return $user->hasRole('admin');
    }

    public function forceDelete(User $user, Facture $facture): bool
    {
        return $user->hasRole('admin');
    }
}
