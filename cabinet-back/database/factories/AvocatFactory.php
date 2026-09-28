<?php

namespace Database\Factories;

use App\Models\Avocat;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Avocat>
 */
class AvocatFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'nom' => fake()->lastName(),
            'prenom' => fake()->firstName(),
            'specialite' => fake()->randomElement([
                'Droit pénal', 'Droit commercial', 'Droit de la famille',
                'Droit fiscal', 'Droit du travail', 'Droit immobilier',
            ]),
            'telephone' => '+261 '.fake()->numerify('3# ### ## ##'),
            'barreau' => fake()->randomElement(['Antananarivo', 'Toamasina', 'Antsirabe']),
            'actif' => true,
        ];
    }
}
