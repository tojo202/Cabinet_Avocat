<?php

namespace App\Console\Commands;

use App\Models\Facture;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class MarquerFacturesEnRetard extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'factures:marquer-en-retard';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Alimente le cache des factures en retard (dérivé de date_echeance, statut non modifié)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $enRetard = Facture::query()
            ->where('statut', 'en_attente')
            ->where('date_echeance', '<', now()->toDateString())
            ->get()
            ->map(fn (Facture $facture): array => [
                'id' => $facture->id,
                'numero' => $facture->numero,
                'montant' => $facture->montant_total,
                'solde' => $facture->solde,
                'jours_retard' => now()->diffInDays($facture->date_echeance),
            ]);

        Cache::put('factures.en_retard', $enRetard->values()->all(), now()->addDay());
        Cache::put('factures.en_retard.total', (int) $enRetard->sum('montant'), now()->addDay());
        Cache::put('factures.en_retard.updated_at', now()->toIso8601String(), now()->addDay());

        $this->info($enRetard->count().' facture(s) en retard identifiée(s).');

        return self::SUCCESS;
    }
}
