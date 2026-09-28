<?php

use App\Models\Avocat;
use App\Models\Client;
use App\Models\Dossier;
use App\Models\Facture;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function makeRoleUser(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::findOrCreate($role));

    return $user;
}

function makeDossierWithAvocat(): array
{
    $avocatUser = makeRoleUser('avocat');
    $avocat = Avocat::factory()->create(['user_id' => $avocatUser->id]);
    $dossier = Dossier::factory()->create();
    $dossier->avocats()->attach($avocat->id, ['role' => 'principal']);

    return [$avocatUser, $dossier];
}

test('un avocat ne peut pas voir les dossiers d\'un autre avocat', function () {
    [$avocatUser, $dossier] = makeDossierWithAvocat();
    $autreDossier = Dossier::factory()->create();

    expect($avocatUser->can('view', $dossier))->toBeTrue()
        ->and($avocatUser->can('view', $autreDossier))->toBeFalse();
});

test('un avocat ne peut pas modifier un dossier qui ne lui est pas assigné', function () {
    [$avocatUser, $dossier] = makeDossierWithAvocat();
    $autreDossier = Dossier::factory()->create();

    expect($avocatUser->can('update', $dossier))->toBeTrue()
        ->and($avocatUser->can('update', $autreDossier))->toBeFalse();
});

test('l\'admin a un accès total', function () {
    $admin = makeRoleUser('admin');
    $dossier = Dossier::factory()->create();
    $facture = Facture::factory()->create();
    $client = Client::factory()->create();

    expect($admin->can('view', $dossier))->toBeTrue()
        ->and($admin->can('update', $dossier))->toBeTrue()
        ->and($admin->can('delete', $dossier))->toBeTrue()
        ->and($admin->can('update', $facture))->toBeTrue()
        ->and($admin->can('create', $client))->toBeTrue();
});

test('la secrétaire n\'a aucun accès aux factures', function () {
    $secretaire = makeRoleUser('secretaire');
    $facture = Facture::factory()->create();

    expect($secretaire->can('viewAny', Facture::class))->toBeFalse()
        ->and($secretaire->can('view', $facture))->toBeFalse()
        ->and($secretaire->can('update', $facture))->toBeFalse()
        ->and($secretaire->can('create', Facture::class))->toBeFalse();
});

test('la secrétaire gère clients, dossiers et documents', function () {
    $secretaire = makeRoleUser('secretaire');
    $client = Client::factory()->create();
    $dossier = Dossier::factory()->create();

    expect($secretaire->can('create', Client::class))->toBeTrue()
        ->and($secretaire->can('update', $client))->toBeTrue()
        ->and($secretaire->can('update', $dossier))->toBeTrue()
        ->and($secretaire->can('delete', $dossier))->toBeFalse();
});

test('le comptable gère les factures mais reste en lecture ailleurs', function () {
    $comptable = makeRoleUser('comptable');
    $facture = Facture::factory()->create();
    $dossier = Dossier::factory()->create();

    expect($comptable->can('update', $facture))->toBeTrue()
        ->and($comptable->can('create', Facture::class))->toBeTrue()
        ->and($comptable->can('update', $dossier))->toBeFalse()
        ->and($comptable->can('create', Client::class))->toBeFalse()
        ->and($comptable->can('view', $dossier))->toBeTrue();
});

test('la secrétaire ne peut pas supprimer un client', function () {
    $secretaire = makeRoleUser('secretaire');
    $client = Client::factory()->create();

    expect($secretaire->can('delete', $client))->toBeFalse();
});
