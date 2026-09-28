<?php

namespace Database\Factories;

use App\Enums\TypeEvenement;
use App\Models\Dossier;
use App\Models\Evenement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Evenement>
 */
class EvenementFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $debut = fake()->dateTimeBetween('-1 month', '+2 months');
        $fin = (clone $debut)->modify('+'.fake()->numberBetween(30, 120).' minutes');

        return [
            'dossier_id' => fake()->boolean(70) ? Dossier::factory() : null,
            'client_id' => null,
            'titre' => fake()->randomElement([
                'Audience', 'Rendez-vous client', 'Échéance de procédure',
                'Réunion avec la partie adverse', 'Dépôt de conclusions',
            ]),
            'type' => fake()->randomElement(TypeEvenement::cases()),
            'debut' => $debut->format('Y-m-d H:i:s'),
            'fin' => $fin->format('Y-m-d H:i:s'),
            'lieu' => fake()->randomElement([
                'Tribunal de première instance d\'Antananarivo',
                'Cabinet', 'Notariat', 'Visioconférence', null,
            ]),
            'description' => fake()->boolean(60) ? fake()->sentence() : null,
        ];
    }
}
