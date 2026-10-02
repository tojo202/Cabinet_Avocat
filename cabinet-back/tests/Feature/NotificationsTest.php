<?php

use App\Enums\StatutDossier;
use App\Models\Dossier;
use App\Models\Evenement;
use App\Models\Facture;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('la liste des notifications est renvoyée au format attendu', function () {
    Facture::factory()->enAttente()->create(['dossier_id' => null, 'date_echeance' => now()->subDays(5)->toDateString()]);

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/notifications')
        ->assertOk()
        ->assertJsonStructure(['data' => [['id', 'type', 'criticite', 'titre', 'message', 'lien', 'date']], 'total']);
});

test('une facture en retard produit une notification haute criticité', function () {
    Facture::factory()->enAttente()->create(['dossier_id' => null, 'date_echeance' => now()->subDays(5)->toDateString()]);

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $response = $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/notifications')
        ->assertOk()
        ->assertJsonPath('data.0.type', 'facture_retard')
        ->assertJsonPath('data.0.criticite', 'haute')
        ->assertJsonPath('data.0.lien', '/facturation');

    expect($response->json('total'))->toBe(1);
});

test('une facture payée ou annulée ne produit pas de notification', function () {
    Facture::factory()->payee()->create(['dossier_id' => null, 'date_echeance' => now()->subDays(5)->toDateString()]);
    Facture::factory()->create(['dossier_id' => null, 'statut' => 'annulee', 'date_echeance' => now()->subDays(5)->toDateString()]);

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/notifications')
        ->assertOk()
        ->assertJsonPath('total', 0);
});

test('un dossier urgent non clôturé produit une notification', function () {
    Dossier::factory()->urgent()->create(['statut' => StatutDossier::EnCours]);
    Dossier::factory()->urgent()->cloture()->create();

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $response = $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/notifications')
        ->assertOk();

    expect($response->json('total'))->toBe(1)
        ->and($response->json('data.0.type'))->toBe('dossier_urgent')
        ->and($response->json('data.0.lien'))->toBe('/dossiers');
});

test('un événement du jour produit une notification', function () {
    Evenement::factory()->create(['dossier_id' => null, 'debut' => now()->setTime(9, 30)]);

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/notifications')
        ->assertOk()
        ->assertJsonPath('data.0.type', 'evenement_jour')
        ->assertJsonPath('data.0.criticite', 'info')
        ->assertJsonPath('data.0.lien', '/calendrier');
});

test('les notifications sont ordonnées par criticité décroissante', function () {
    Facture::factory()->enAttente()->create([
        'dossier_id' => null,
        'date_echeance' => now()->subDays(5)->toDateString(),
    ]);
    Dossier::factory()->urgent()->create(['statut' => StatutDossier::EnCours]);
    Evenement::factory()->create(['dossier_id' => null, 'debut' => now()->setTime(9, 30)]);

    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $response = $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/notifications')
        ->assertOk();

    expect($response->json('data.*.criticite'))->toBe(['haute', 'moyenne', 'info']);
});

test('une secrétaire ne reçoit pas les notifications de facturation', function () {
    Facture::factory()->enAttente()->create(['dossier_id' => null, 'date_echeance' => now()->subDays(5)->toDateString()]);

    $secretaire = User::factory()->create();
    $secretaire->assignRole('secretaire');

    $response = $this->actingAs($secretaire, 'sanctum')
        ->getJson('/api/v1/notifications')
        ->assertOk();

    expect($response->json('total'))->toBe(0);
});

test('les notifications nécessitent une authentification', function () {
    $this->getJson('/api/v1/notifications')->assertUnauthorized();
});
