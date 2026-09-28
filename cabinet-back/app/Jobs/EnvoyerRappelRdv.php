<?php

namespace App\Jobs;

use App\Models\Evenement;
use App\Models\User;
use App\Notifications\RappelRdvNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class EnvoyerRappelRdv implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public function __construct(public Evenement $evenement) {}

    public function handle(): void
    {
        $destinataires = $this->destinataires();

        foreach ($destinataires as $destinataire) {
            $destinataire->notify(new RappelRdvNotification($this->evenement));
        }

        Cache::put(
            "rappel_sent_{$this->evenement->id}",
            true,
            now()->addDays(2),
        );
    }

    /**
     * @return Collection<int, User>
     */
    private function destinataires(): Collection
    {
        $dossier = $this->evenement->dossier;

        if ($dossier && $dossier->avocats->isNotEmpty()) {
            return $dossier->avocats->pluck('user')->filter();
        }

        return User::role('admin')->get();
    }
}
