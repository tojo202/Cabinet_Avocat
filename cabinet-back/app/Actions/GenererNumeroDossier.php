<?php

namespace App\Actions;

use App\Models\Dossier;

class GenererNumeroDossier
{
    /**
     * Génère une référence unique DOS-AAAA-NNN (incrémentale par année).
     */
    public function execute(): string
    {
        $annee = now()->year;

        $dernier = Dossier::withTrashed()
            ->whereYear('date_ouverture', $annee)
            ->where('reference', 'like', "DOS-{$annee}-%")
            ->orderByDesc('reference')
            ->value('reference');

        $prochain = $dernier
            ? ((int) substr($dernier, -3)) + 1
            : 1;

        return sprintf('DOS-%d-%03d', $annee, $prochain);
    }
}
