<?php

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
