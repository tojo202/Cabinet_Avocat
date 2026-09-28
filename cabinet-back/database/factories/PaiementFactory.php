<?php

namespace Database\Factories;

use App\Enums\ModePaiement;
use App\Models\Facture;
use App\Models\Paiement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Paiement>
 */
class PaiementFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'facture_id' => Facture::factory(),
            'montant' => fake()->numberBetween(100_000, 10_000_000),
            'mode' => fake()->randomElement(ModePaiement::cases()),
            'date_paiement' => fake()->dateTimeBetween('-3 months', 'now')->format('Y-m-d'),
            'reference' => fake()->boolean(50) ? strtoupper(fake()->lexify('????-####')) : null,
            'notes' => null,
        ];
    }
}
