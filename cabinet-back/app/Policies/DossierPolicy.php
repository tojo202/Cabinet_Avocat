<?php

namespace App\Policies;

use App\Models\Dossier;
use App\Models\User;

class DossierPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('dossiers.view');
    }

    public function view(User $user, Dossier $dossier): bool
    {
        if ($user->hasRole('avocat')) {
            return $this->isAssigned($user, $dossier);
        }

        return $user->can('dossiers.view');
    }

    public function create(User $user): bool
    {
        return $user->can('dossiers.manage');
    }

    public function update(User $user, Dossier $dossier): bool
    {
        if ($user->hasRole('avocat')) {
            return $this->isAssigned($user, $dossier);
        }

        return $user->can('dossiers.manage');
    }

    public function delete(User $user, Dossier $dossier): bool
    {
        return $user->hasRole('admin');
    }

    public function manageStatut(User $user, Dossier $dossier): bool
    {
        return $this->update($user, $dossier);
    }

    public function assignAvocats(User $user, Dossier $dossier): bool
    {
        return $user->hasRole('admin') || ($user->can('dossiers.manage') && ! $user->hasRole('avocat'));
    }

    public function dashboard(User $user, Dossier $dossier): bool
    {
        return $user->can('dashboard.view');
    }

    public function restore(User $user, Dossier $dossier): bool
    {
        return $user->hasRole('admin');
    }

    public function forceDelete(User $user, Dossier $dossier): bool
    {
        return $user->hasRole('admin');
    }

    private function isAssigned(User $user, Dossier $dossier): bool
    {
        $avocat = $user->avocat;

        if (! $avocat) {
            return false;
        }

        return $dossier->avocats()->where('avocats.id', $avocat->id)->exists();
    }
}
