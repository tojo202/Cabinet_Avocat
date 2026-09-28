<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\User;

class ClientPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('clients.view');
    }

    public function view(User $user, Client $client): bool
    {
        if ($user->hasRole('avocat')) {
            if (! $avocat = $user->avocat) {
                return false;
            }

            return $client->dossiers()
                ->whereHas('avocats', fn ($q) => $q->where('avocats.id', $avocat->id))
                ->exists();
        }

        return $user->can('clients.view');
    }

    public function create(User $user): bool
    {
        return $user->can('clients.create');
    }

    public function update(User $user, Client $client): bool
    {
        if ($user->hasRole('avocat')) {
            return $this->view($user, $client) && $user->can('clients.update');
        }

        return $user->can('clients.update');
    }

    public function delete(User $user, Client $client): bool
    {
        return $user->can('clients.delete');
    }

    public function export(User $user): bool
    {
        return $user->can('clients.export');
    }

    public function restore(User $user, Client $client): bool
    {
        return $user->can('clients.delete');
    }

    public function forceDelete(User $user, Client $client): bool
    {
        return $user->hasRole('admin');
    }
}
