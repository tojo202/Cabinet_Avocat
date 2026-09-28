<?php

namespace Database\Factories;

use App\Enums\TypeClient;
use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Client>
 */
class ClientFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = fake()->randomElement([TypeClient::Particulier, TypeClient::Societe]);

        return [
            'type_client' => $type,
            'nom' => fake()->lastName(),
            'prenom' => fake()->firstName(),
            'raison_sociale' => $type === TypeClient::Societe
                ? ucfirst(fake()->company()).' '.fake()->randomElement(['SARL', 'SA', 'SAS', 'EURL'])
                : null,
            'email' => fake()->unique()->safeEmail(),
            'telephone' => '+261 '.fake()->numerify('3# ### ## ##'),
            'adresse' => fake()->address(),
            'nif' => $type === TypeClient::Societe ? fake()->numerify('###########') : null,
            'stat' => $type === TypeClient::Societe ? fake()->numerify('########') : null,
            'actif' => true,
        ];
    }

    public function particulier(): static
    {
        return $this->state(fn () => [
            'type_client' => TypeClient::Particulier,
            'raison_sociale' => null,
            'nif' => null,
            'stat' => null,
        ]);
    }

    public function societe(): static
    {
        return $this->state(fn () => [
            'type_client' => TypeClient::Societe,
        ]);
    }
}
