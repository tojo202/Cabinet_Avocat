<?php

use App\Models\Avocat;
use App\Models\Client;
use App\Models\Dossier;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function apiUserWithRole(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::findOrCreate($role));

    return $user;
}

test('un avocat ne voit que ses dossiers dans la liste', function () {
    $avocatUser = apiUserWithRole('avocat');
    $avocat = Avocat::factory()->create(['user_id' => $avocatUser->id]);

    $dossierAssigne = Dossier::factory()->create();
    $dossierAssigne->avocats()->attach($avocat->id, ['role' => 'principal']);
    $autreDossier = Dossier::factory()->create();

    $response = $this->actingAs($avocatUser, 'sanctum')
        ->getJson('/api/v1/dossiers')
        ->assertOk();

    $ids = collect($response->json('data'))->pluck('id');

    expect($ids)->toContain($dossierAssigne->id)
        ->and($ids)->not->toContain($autreDossier->id);
});

test('un avocat reçoit 403 sur un dossier qui ne lui est pas assigné', function () {
    $avocatUser = apiUserWithRole('avocat');
    Avocat::factory()->create(['user_id' => $avocatUser->id]);
    $autreDossier = Dossier::factory()->create();

    $this->actingAs($avocatUser, 'sanctum')
        ->getJson("/api/v1/dossiers/{$autreDossier->id}")
        ->assertForbidden();
});

test('la secrétaire reçoit 403 sur les factures', function () {
    $secretaire = apiUserWithRole('secretaire');

    $this->actingAs($secretaire, 'sanctum')
        ->getJson('/api/v1/factures')
        ->assertForbidden();

    $this->actingAs($secretaire, 'sanctum')
        ->getJson('/api/v1/factures/stats')
        ->assertForbidden();
});

test('le comptable peut consulter les factures mais pas créer de client', function () {
    $comptable = apiUserWithRole('comptable');

    $this->actingAs($comptable, 'sanctum')
        ->getJson('/api/v1/factures')
        ->assertOk();

    $this->actingAs($comptable, 'sanctum')
        ->postJson('/api/v1/clients', ['type_client' => 'particulier', 'nom' => 'Test'])
        ->assertForbidden();
});

test('l\'admin crée un client et le retrouve avec filtres', function () {
    $admin = apiUserWithRole('admin');

    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/v1/clients', [
            'type_client' => 'particulier',
            'nom' => 'Rakotoarisoa',
            'prenom' => 'Fianja',
            'email' => 'fianja@test.mg',
        ])
        ->assertCreated()
        ->assertJsonPath('data.type_client', 'particulier');

    $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/clients?filter[type]=societe')
        ->assertOk()
        ->assertJsonMissingPath('data.0.email', 'fianja@test.mg');
});

test('la création de dossier génère une référence DOS', function () {
    $admin = apiUserWithRole('admin');
    $client = Client::factory()->create();

    $response = $this->actingAs($admin, 'sanctum')
        ->postJson('/api/v1/dossiers', [
            'client_id' => $client->id,
            'titre' => 'Dossier de test',
            'type_droit' => 'pénal',
            'date_ouverture' => now()->toDateString(),
            'montant' => 1_000_000,
        ])
        ->assertCreated();

    expect($response->json('data.reference'))->toMatch('/^DOS-\d{4}-\d{3}$/');
});

test('le changement de statut d\'un dossier fonctionne', function () {
    $admin = apiUserWithRole('admin');
    $dossier = Dossier::factory()->create();

    $this->actingAs($admin, 'sanctum')
        ->patchJson("/api/v1/dossiers/{$dossier->id}/statut", ['statut' => 'cloture'])
        ->assertOk()
        ->assertJsonPath('data.statut', 'cloture')
        ->assertJsonPath('data.avancement', 100);
});

test('les stats dashboard renvoient les KPI', function () {
    $admin = apiUserWithRole('admin');

    $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/dashboard/stats')
        ->assertOk()
        ->assertJsonStructure(['clients_actifs', 'dossiers_en_cours', 'dossiers_urgents', 'total_documents']);

    $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/dashboard/activite')
        ->assertOk()
        ->assertJsonCount(7);
});
