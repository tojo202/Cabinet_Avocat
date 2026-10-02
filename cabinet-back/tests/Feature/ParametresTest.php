<?php

use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('un administrateur peut lire les paramètres système', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/settings')
        ->assertOk()
        ->assertJsonStructure(['data' => ['nom_cabinet', 'raison_sociale', 'devise', 'fuseau', 'en_tete_facture']]);
});

test('un avocat ne peut pas lire ni modifier les paramètres', function () {
    $avocat = User::factory()->create();
    $avocat->assignRole('avocat');

    $this->actingAs($avocat, 'sanctum')
        ->getJson('/api/v1/settings')
        ->assertForbidden();

    $this->actingAs($avocat, 'sanctum')
        ->putJson('/api/v1/settings', ['parametres' => ['nom_cabinet' => 'Hacker']])
        ->assertForbidden();
});

test('les paramètres sont persistés en base', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin, 'sanctum')
        ->putJson('/api/v1/settings', [
            'parametres' => [
                'nom_cabinet' => 'Cabinet Rakoto & Associés',
                'devise' => 'EUR',
            ],
        ])
        ->assertOk()
        ->assertJsonPath('data.nom_cabinet', 'Cabinet Rakoto & Associés');

    expect(Setting::valeurs()['devise'])->toBe('EUR');

    $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/settings')
        ->assertOk()
        ->assertJsonPath('data.devise', 'EUR');
});

test('une clé de paramètre inconnue est rejetée', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin, 'sanctum')
        ->putJson('/api/v1/settings', ['parametres' => ['cle_inconnue' => 'x']])
        ->assertStatus(422);
});

test('la requête des paramètres doit contenir le tableau parametres', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin, 'sanctum')
        ->putJson('/api/v1/settings', [])
        ->assertStatus(422);
});
