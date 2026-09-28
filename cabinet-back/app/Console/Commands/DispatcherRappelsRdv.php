<?php

namespace App\Console\Commands;

use App\Enums\TypeEvenement;
use App\Jobs\EnvoyerRappelRdv;
use App\Models\Evenement;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class DispatcherRappelsRdv extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'rappels:dispatcher';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Dispatche les jobs de rappel 24h avant chaque rendez-vous / audience';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $evenements = Evenement::query()
            ->whereIn('type', [TypeEvenement::RendezVous->value, TypeEvenement::Audience->value])
            ->whereBetween('debut', [now(), now()->addDay()])
            ->get()
            ->filter(fn (Evenement $evenement): bool => ! Cache::has("rappel_sent_{$evenement->id}"));

        foreach ($evenements as $evenement) {
            EnvoyerRappelRdv::dispatch($evenement);
        }

        $this->info($evenements->count().' rappel(s) dispatché(s).');

        return self::SUCCESS;
    }
}
