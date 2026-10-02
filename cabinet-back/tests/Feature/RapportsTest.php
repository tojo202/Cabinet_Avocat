<?php

use App\Enums\StatutFacture;
use App\Models\Avocat;
use App\Models\Dossier;
use App\Models\Facture;
use App\Models\Paiement;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function periodeQuery(): string
{
    return 'debut='.now()->startOfMonth()->format('Y-m-d').'&fin='.now()->format('Y-m-d');
}

test('un comptable peut consulter la synthèse de la période', function () {
    $comptable = User::factory()->create();
    $comptable->assignRole('comptable');

    $facture = Facture::factory()->create([
        'date_facture' => now()->toDateString(),
        'montant_total' => 1_000_000,
        'statut' => StatutFacture::EnAttente,
    ]);

    Paiement::factory()->create([
        'facture_id' => $facture->id,
        'date_paiement' => now()->toDateString(),
        'montant' => 400_000,
    ]);

    $response = $this->actingAs($comptable, 'sanctum')
        ->getJson('/api/v1/rapports/synthese?'.periodeQuery())
        ->assertOk()
        ->assertJsonStructure([
            'periode' => ['debut', 'fin'],
            'nouveaux_clients',
            'dossiers_ouverts',
            'dossiers_clotures',
            'dossiers_par_statut' => [['statut', 'total']],
            'facturation' => ['nb_factures', 'facture', 'encaisse', 'impaye'],
            'paiements' => ['nombre', 'total', 'par_mode' => [['mode', 'nombre', 'total']]],
            'top_clients' => [['id', 'nom', 'nombre_factures', 'montant']],
            'par_avocat',
        ]);

    expect($response->json('facturation.nb_factures'))->toBe(1)
        ->and($response->json('facturation.facture'))->toBe(1_000_000)
        ->and($response->json('facturation.encaisse'))->toBe(400_000)
        ->and($response->json('facturation.impaye'))->toBe(600_000)
        ->and($response->json('paiements.total'))->toBe(400_000);
});

test('un avocat ne voit que les factures qui lui sont rattachées', function () {
    $avocatUser = User::factory()->create();
    $avocatUser->assignRole('avocat');
    $avocat = Avocat::factory()->create(['user_id' => $avocatUser->id]);

    $dossier = Dossier::factory()->create();
    $dossier->avocats()->attach($avocat->id, ['role' => 'principal']);

    Facture::factory()->create([
        'dossier_id' => $dossier->id,
        'date_facture' => now()->toDateString(),
        'montant_total' => 500_000,
        'statut' => StatutFacture::EnAttente,
    ]);
    Facture::factory()->create([
        'date_facture' => now()->toDateString(),
        'montant_total' => 900_000,
        'statut' => StatutFacture::EnAttente,
    ]);

    $response = $this->actingAs($avocatUser, 'sanctum')
        ->getJson('/api/v1/rapports/synthese?'.periodeQuery())
        ->assertOk();

    expect($response->json('facturation.nb_factures'))->toBe(1)
        ->and($response->json('facturation.facture'))->toBe(500_000);
});

test('la secrétaire reçoit 403 sur les rapports', function () {
    $secretaire = User::factory()->create();
    $secretaire->assignRole('secretaire');

    $this->actingAs($secretaire, 'sanctum')
        ->getJson('/api/v1/rapports/synthese')
        ->assertForbidden();

    $this->actingAs($secretaire, 'sanctum')
        ->getJson('/api/v1/rapports/evolution')
        ->assertForbidden();

    $this->actingAs($secretaire, 'sanctum')
        ->get('/api/v1/rapports/export')
        ->assertForbidden();
});

test('une période inversée est refusée', function () {
    $comptable = User::factory()->create();
    $comptable->assignRole('comptable');

    $this->actingAs($comptable, 'sanctum')
        ->getJson('/api/v1/rapports/synthese?debut=2026-06-30&fin=2026-06-01')
        ->assertStatus(422)
        ->assertJsonValidationErrors('fin');
});

test("l'évolution restitue une série par mois", function () {
    $comptable = User::factory()->create();
    $comptable->assignRole('comptable');

    Facture::factory()->create([
        'date_facture' => now()->format('Y-m-d'),
        'montant_total' => 250_000,
    ]);

    $debut = now()->subMonths(2)->startOfMonth();
    $response = $this->actingAs($comptable, 'sanctum')
        ->getJson('/api/v1/rapports/evolution?debut='.$debut->format('Y-m-d').'&fin='.now()->format('Y-m-d'))
        ->assertOk()
        ->assertJsonStructure(['granularite', 'periode', 'data' => [['periode', 'factures', 'encaisse', 'dossiers']]]);

    expect($response->json('granularite'))->toBe('mois')
        ->and($response->json('data'))->toHaveCount(3);
});

test('la secrétaire ne peut pas exporter le rapport', function () {
    $secretaire = User::factory()->create();
    $secretaire->assignRole('secretaire');

    $this->actingAs($secretaire, 'sanctum')
        ->get('/api/v1/rapports/export')
        ->assertForbidden();
});

test('un comptable exporte les factures de la période en CSV', function () {
    $comptable = User::factory()->create();
    $comptable->assignRole('comptable');

    Facture::factory()->create([
        'date_facture' => now()->toDateString(),
        'montant_total' => 750_000,
    ]);

    $response = $this->actingAs($comptable, 'sanctum')
        ->get('/api/v1/rapports/export?'.periodeQuery())
        ->assertOk();

    expect($response->headers->get('Content-Type'))->toBe('text/csv; charset=UTF-8')
        ->and($response->headers->get('Content-Disposition'))->toContain('attachment')
        ->and($response->getContent())->toContain('N° facture')
        ->and($response->getContent())->toContain('750000');
});
