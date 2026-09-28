<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('documents.view');
    }

    public function view(User $user, Document $document): bool
    {
        if ($user->hasRole('avocat')) {
            if (! $document->dossier_id) {
                return false;
            }

            return $this->dossierAssigned($user, $document);
        }

        return $user->can('documents.view');
    }

    public function create(User $user): bool
    {
        return $user->can('documents.manage');
    }

    public function update(User $user, Document $document): bool
    {
        return $user->can('documents.manage');
    }

    public function delete(User $user, Document $document): bool
    {
        if ($user->hasRole('avocat')) {
            return $this->dossierAssigned($user, $document);
        }

        return $user->can('documents.manage') && ! $user->hasRole('comptable');
    }

    public function download(User $user, Document $document): bool
    {
        return $this->view($user, $document);
    }

    public function restore(User $user, Document $document): bool
    {
        return $user->hasRole(['admin', 'secretaire']);
    }

    public function forceDelete(User $user, Document $document): bool
    {
        return $user->hasRole('admin');
    }

    private function dossierAssigned(User $user, Document $document): bool
    {
        $avocat = $user->avocat;

        if (! $avocat || ! $document->dossier_id) {
            return false;
        }

        return $document->dossier()
            ->whereHas('avocats', fn ($q) => $q->where('avocats.id', $avocat->id))
            ->exists();
    }
}
