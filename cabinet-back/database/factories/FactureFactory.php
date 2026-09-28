<?php

namespace Database\Factories;

use App\Enums\StatutFacture;
use App\Models\Client;
use App\Models\Dossier;
use App\Models\Facture;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Facture>
 */
class FactureFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $dateFacture = fake()->dateTimeBetween('-6 months', 'now');
        $dateEcheance = (clone $dateFacture)->modify('+30 days');

        return [
            'numero' => sprintf(
                'FACT-%s-%03d',
                date('Y', $dateFacture->getTimestamp()),
                fake()->unique()->numberBetween(1, 999),
            ),
            'client_id' => Client::factory(),
            'dossier_id' => fake()->boolean(70) ? Dossier::factory() : null,
            'date_facture' => $dateFacture->format('Y-m-d'),
            'date_echeance' => $dateEcheance->format('Y-m-d'),
            'statut' => fake()->randomElement([
                StatutFacture::Payee, StatutFacture::Payee, StatutFacture::EnAttente,
                StatutFacture::Brouillon, StatutFacture::Annulee,
            ]),
            'montant_total' => fake()->numberBetween(200_000, 25_000_000),
            'notes' => fake()->boolean(30) ? fake()->sentence() : null,
        ];
    }

    public function enAttente(): static
    {
        return $this->state(fn () => [
            'statut' => StatutFacture::EnAttente,
        ]);
    }

    public function payee(): static
    {
        return $this->state(fn () => [
            'statut' => StatutFacture::Payee,
        ]);
    }
}
