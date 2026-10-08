<?php

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function makeUser(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole(Role::findOrCreate($role));

    return $user;
}

test('login retourne un token, l\'utilisateur et le rôle', function () {
    $user = makeUser('secretaire');
    $user->password = bcrypt('secret123');
    $user->save();

    $response = $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'secret123',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role'], 'role'])
        ->assertJson(['role' => 'secretaire']);
});

test('login échoue avec un mauvais mot de passe', function () {
    $user = makeUser('avocat');
    $user->password = bcrypt('secret123');
    $user->save();

    $this->postJson('/api/v1/auth/login', [
        'email' => $user->email,
        'password' => 'mauvais',
    ])->assertUnprocessable();
});

test('me renvoie le profil de l\'utilisateur connecté', function () {
    $user = makeUser('admin');

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('user.id', $user->id)
        ->assertJsonPath('role', 'admin');
});

test('la route me exige un token', function () {
    $this->getJson('/api/v1/auth/me')->assertUnauthorized();
});

test('logout révoque le token courant', function () {
    $user = makeUser('avocat');
    $token = $user->createToken('api')->plainTextToken;

    $this->withToken($token)
        ->postJson('/api/v1/auth/logout')
        ->assertOk();

    expect(PersonalAccessToken::findToken($token))->toBeNull();

    $this->app['auth']->forgetGuards();

    $this->withToken($token)
        ->getJson('/api/v1/auth/me')
        ->assertUnauthorized();
});

test('me met à jour le profil de l\'utilisateur connecté', function () {
    $user = makeUser('secretaire');

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/auth/me', [
            'name' => 'Nouveau Nom',
            'email' => 'nouveau@cabinet.mg',
        ])
        ->assertOk()
        ->assertJsonPath('user.name', 'Nouveau Nom')
        ->assertJsonPath('user.email', 'nouveau@cabinet.mg')
        ->assertJsonPath('role', 'secretaire');

    expect($user->fresh()->email)->toBe('nouveau@cabinet.mg');
});

test('me refuse une adresse e-mail déjà utilisée', function () {
    $user = makeUser('avocat');
    $autre = makeUser('secretaire');

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/auth/me', [
            'name' => $user->name,
            'email' => $autre->email,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('email');
});

test('la route me en PUT exige un token', function () {
    $this->putJson('/api/v1/auth/me', [
        'name' => 'Sans Token',
        'email' => 'sans-token@cabinet.mg',
    ])->assertUnauthorized();
});

test('changement de mot de passe avec le mot de passe actuel correct', function () {
    $user = makeUser('avocat');
    $user->password = bcrypt('secret123');
    $user->save();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/auth/password', [
            'current_password' => 'secret123',
            'password' => 'nouveaumotdepasse',
            'password_confirmation' => 'nouveaumotdepasse',
        ])
        ->assertOk();

    expect(Hash::check('nouveaumotdepasse', $user->fresh()->password))->toBeTrue();
});

test('changement de mot de passe refuse le mot de passe actuel incorrect', function () {
    $user = makeUser('avocat');
    $user->password = bcrypt('secret123');
    $user->save();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/auth/password', [
            'current_password' => 'mauvais',
            'password' => 'nouveaumotdepasse',
            'password_confirmation' => 'nouveaumotdepasse',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('current_password');
});

test('changement de mot de passe exige une confirmation valide', function () {
    $user = makeUser('secretaire');
    $user->password = bcrypt('secret123');
    $user->save();

    $this->actingAs($user, 'sanctum')
        ->putJson('/api/v1/auth/password', [
            'current_password' => 'secret123',
            'password' => 'court',
            'password_confirmation' => 'autre',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});
