<?php

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('un administrateur peut lister les utilisateurs', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/users')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [['id', 'name', 'email', 'role', 'created_at']],
            'meta',
        ]);
});

test("un avocat n'a pas accès à la gestion des utilisateurs", function () {
    $avocat = User::factory()->create();
    $avocat->assignRole('avocat');

    $this->actingAs($avocat, 'sanctum')
        ->getJson('/api/v1/users')
        ->assertForbidden();

    $this->actingAs($avocat, 'sanctum')
        ->postJson('/api/v1/users', [
            'name' => 'Intrus',
            'email' => 'intrus@cabinet.mg',
            'role' => 'admin',
            'password' => 'password',
        ])
        ->assertForbidden();
});

test('un administrateur crée un utilisateur avec son rôle', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/v1/users', [
            'name' => 'Mialy Ranaivo',
            'email' => 'mialy@cabinet.mg',
            'role' => 'secretaire',
            'password' => 'secret123',
        ])
        ->assertCreated()
        ->assertJsonPath('data.role', 'secretaire');

    $creee = User::where('email', 'mialy@cabinet.mg')->firstOrFail();

    expect($creee->hasRole('secretaire'))->toBeTrue();
});

test('la création exige un mot de passe valide', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/v1/users', [
            'name' => 'Mialy Ranaivo',
            'email' => 'mialy@cabinet.mg',
            'role' => 'secretaire',
            'password' => 'court',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('password');
});

test("un administrateur change le rôle d'un autre utilisateur", function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $cible = User::factory()->create();
    $cible->assignRole('comptable');

    $this->actingAs($admin, 'sanctum')
        ->putJson("/api/v1/users/{$cible->id}", [
            'name' => $cible->name,
            'email' => $cible->email,
            'role' => 'avocat',
        ])
        ->assertOk()
        ->assertJsonPath('data.role', 'avocat');

    expect($cible->fresh()->hasRole('avocat'))->toBeTrue();
});

test('impossible de modifier son propre rôle', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin, 'sanctum')
        ->putJson("/api/v1/users/{$admin->id}", [
            'name' => $admin->name,
            'email' => $admin->email,
            'role' => 'avocat',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('role');

    expect($admin->fresh()->hasRole('admin'))->toBeTrue();
});

test('impossible de se supprimer soi-même', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin, 'sanctum')
        ->deleteJson("/api/v1/users/{$admin->id}")
        ->assertStatus(422);

    expect(User::whereKey($admin->id)->exists())->toBeTrue();
});

test('un administrateur supprime un autre utilisateur', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $cible = User::factory()->create();
    $cible->assignRole('secretaire');

    $this->actingAs($admin, 'sanctum')
        ->deleteJson("/api/v1/users/{$cible->id}")
        ->assertStatus(204);

    expect(User::whereKey($cible->id)->exists())->toBeFalse();
});

test('le dernier administrateur ne peut pas être supprimé', function () {
    $admin = User::factory()->create();
    $admin->assignRole('admin');
    $autre = User::factory()->create();
    $autre->assignRole('admin');

    $this->actingAs($autre, 'sanctum')
        ->deleteJson("/api/v1/users/{$admin->id}")
        ->assertStatus(204);

    $this->actingAs($autre, 'sanctum')
        ->deleteJson("/api/v1/users/{$autre->id}")
        ->assertStatus(422);
});

test('la recherche filtre les utilisateurs par nom', function () {
    $admin = User::factory()->create(['name' => 'Tiana Rakoto']);
    $admin->assignRole('admin');
    User::factory()->create(['name' => 'Autre Personne']);

    $response = $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/users?filter[search]=tiana')
        ->assertOk();

    expect($response->json('data'))->toHaveCount(1)
        ->and($response->json('data.0.name'))->toBe('Tiana Rakoto');
});
