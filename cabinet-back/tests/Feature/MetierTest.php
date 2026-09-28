<?php

use App\Actions\GenererNumeroDossier;
use App\Actions\GenererNumeroFacture;
use App\Enums\StatutDossier;
use App\Enums\StatutFacture;
use App\Jobs\EnvoyerRappelRdv;
use App\Models\Dossier;
use App\Models\Evenement;
use App\Models\Facture;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;

uses(RefreshDatabase::class);

test('la génération de référence dossier suit le format DOS-AAAA-NNN', function () {
    $action = app(GenererNumeroDossier::class);
    $reference = $action->execute();

    expect($reference)->toMatch('/^DOS-\d{4}-\d{3}$/');
});

test('les références dossiers sont uniques', function () {
    $action = app(GenererNumeroDossier::class);
    $references = collect(range(1, 5))->map(function () use ($action): string {
        $reference = $action->execute();
        Dossier::factory()->create([
            'reference' => $reference,
            'date_ouverture' => now()->toDateString(),
        ]);

        return $reference;
    });

    expect($references->unique()->count())->toBe(5);
});

test('la référence dossier s\'incrémente après création', function () {
    $dossier = Dossier::factory()->create([
        'date_ouverture' => now()->toDateString(),
        'reference' => sprintf('DOS-%d-001', now()->year),
    ]);

    $nouvelle = app(GenererNumeroDossier::class)->execute();

    expect($nouvelle)->toBe(sprintf('DOS-%d-002', now()->year))
        ->and($nouvelle)->not->toBe($dossier->reference);
});

test('le numéro de facture suit le format FACT-AAAA-NNN et s\'incrémente', function () {
    Facture::factory()->create([
        'date_facture' => now()->toDateString(),
        'numero' => sprintf('FACT-%d-007', now()->year),
    ]);

    $numero = app(GenererNumeroFacture::class)->execute();

    expect($numero)->toBe(sprintf('FACT-%d-008', now()->year));
});

test('une facture en attente passée à échéance est en retard', function () {
    $facture = Facture::factory()->create([
        'statut' => StatutFacture::EnAttente,
        'date_echeance' => now()->subDays(5)->toDateString(),
    ]);

    expect($facture->isEnRetard())->toBeTrue();
});

test('une facture payée ou future n\'est pas en retard', function () {
    $payee = Facture::factory()->create([
        'statut' => StatutFacture::Payee,
        'date_echeance' => now()->subDays(5)->toDateString(),
    ]);
    $future = Facture::factory()->create([
        'statut' => StatutFacture::EnAttente,
        'date_echeance' => now()->addDays(10)->toDateString(),
    ]);

    expect($payee->isEnRetard())->toBeFalse()
        ->and($future->isEnRetard())->toBeFalse();
});

test('un dossier clôturé n\'est jamais en retard même avec échéance dépassée', function () {
    $dossier = Dossier::factory()->create(['statut' => StatutDossier::Cloture]);
    Evenement::create([
        'dossier_id' => $dossier->id,
        'titre' => 'Échéance dépassée',
        'type' => 'echeance',
        'debut' => now()->subDays(3),
    ]);

    expect($dossier->isEnRetard())->toBeFalse();
});

test('un dossier avec échéance dépassée est en retard', function () {
    $dossier = Dossier::factory()->create(['statut' => StatutDossier::EnCours]);
    Evenement::create([
        'dossier_id' => $dossier->id,
        'titre' => 'Échéance dépassée',
        'type' => 'echeance',
        'debut' => now()->subDays(3),
    ]);

    expect($dossier->fresh()->isEnRetard())->toBeTrue();
});

test('la commande retards alimente le cache sans modifier le statut', function () {
    $facture = Facture::factory()->create([
        'statut' => StatutFacture::EnAttente,
        'date_echeance' => now()->subDays(10)->toDateString(),
        'montant_total' => 1_000_000,
    ]);

    $this->artisan('factures:marquer-en-retard')->assertSuccessful();

    $enRetard = Cache::get('factures.en_retard');

    expect($enRetard)->toBeArray()
        ->and(collect($enRetard)->pluck('id'))->toContain($facture->id)
        ->and(Cache::get('factures.en_retard.total'))->toBe(1_000_000)
        ->and($facture->fresh()->statut)->toBe(StatutFacture::EnAttente);
});

test('clôturer un dossier force l\'avancement à 100 et journalise le changement', function () {
    $dossier = Dossier::factory()->create([
        'statut' => StatutDossier::EnCours,
        'avancement' => 60,
        'date_cloture' => null,
    ]);

    $dossier->update(['statut' => StatutDossier::Cloture]);

    $dossier->refresh();

    expect($dossier->avancement)->toBe(100)
        ->and($dossier->date_cloture)->not->toBeNull()
        ->and($dossier->activities()->count())->toBeGreaterThan(0);
});

test('un rappel est dispatché pour un évènement dans les 24h', function () {
    Queue::fake();

    Evenement::create([
        'dossier_id' => null,
        'titre' => 'Rendez-vous demain',
        'type' => 'rendez_vous',
        'debut' => now()->addHours(20),
    ]);

    $this->artisan('rappels:dispatcher')->assertSuccessful();

    Queue::assertPushed(EnvoyerRappelRdv::class, 1);
});

test('le rappel n\'est pas dispatché deux fois', function () {
    Queue::fake();

    $evenement = Evenement::create([
        'dossier_id' => null,
        'titre' => 'Rendez-vous demain',
        'type' => 'rendez_vous',
        'debut' => now()->addHours(20),
    ]);
    Cache::put("rappel_sent_{$evenement->id}", true, now()->addDay());

    $this->artisan('rappels:dispatcher')->assertSuccessful();

    Queue::assertNothingPushed();
});
