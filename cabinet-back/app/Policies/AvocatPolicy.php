<?php

namespace App\Policies;

use App\Models\Avocat;
use App\Models\User;

class AvocatPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('avocats.view');
    }

    public function view(User $user, Avocat $avocat): bool
    {
        return $user->can('avocats.view');
    }

    public function create(User $user): bool
    {
        return $user->can('avocats.manage');
    }

    public function update(User $user, Avocat $avocat): bool
    {
        return $user->can('avocats.manage');
    }

    public function delete(User $user, Avocat $avocat): bool
    {
        return $user->hasRole('admin');
    }

    public function restore(User $user, Avocat $avocat): bool
    {
        return $user->hasRole('admin');
    }

    public function forceDelete(User $user, Avocat $avocat): bool
    {
        return $user->hasRole('admin');
    }
}
