<?php

namespace App\Actions;

use App\Models\Facture;

class GenererNumeroFacture
{
    /**
     * Génère un numéro de facture unique FACT-AAAA-NNN (incrémentale par année).
     */
    public function execute(): string
    {
        $annee = now()->year;

        $derniere = Facture::withTrashed()
            ->whereYear('date_facture', $annee)
            ->where('numero', 'like', "FACT-{$annee}-%")
            ->orderByDesc('numero')
            ->value('numero');

        $prochain = $derniere
            ? ((int) substr($derniere, -3)) + 1
            : 1;

        return sprintf('FACT-%d-%03d', $annee, $prochain);
    }
}
