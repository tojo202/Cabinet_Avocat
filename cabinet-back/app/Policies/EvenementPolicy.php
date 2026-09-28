<?php

namespace App\Policies;

use App\Models\Evenement;
use App\Models\User;

class EvenementPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('evenements.view');
    }

    public function view(User $user, Evenement $evenement): bool
    {
        if ($user->hasRole('avocat')) {
            if (! $evenement->dossier_id) {
                return true;
            }

            $avocat = $user->avocat;

            if (! $avocat) {
                return false;
            }

            return $evenement->dossier()
                ->whereHas('avocats', fn ($q) => $q->where('avocats.id', $avocat->id))
                ->exists();
        }

        return $user->can('evenements.view');
    }

    public function create(User $user): bool
    {
        return $user->can('evenements.manage');
    }

    public function update(User $user, Evenement $evenement): bool
    {
        return $user->can('evenements.manage');
    }

    public function delete(User $user, Evenement $evenement): bool
    {
        return $user->hasRole(['admin', 'secretaire']);
    }

    public function restore(User $user, Evenement $evenement): bool
    {
        return $user->hasRole('admin');
    }

    public function forceDelete(User $user, Evenement $evenement): bool
    {
        return $user->hasRole('admin');
    }
}
