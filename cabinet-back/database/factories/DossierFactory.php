<?php

namespace Database\Factories;

use App\Enums\PrioriteDossier;
use App\Enums\StatutDossier;
use App\Models\Client;
use App\Models\Dossier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Dossier>
 */
class DossierFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $dateOuverture = fake()->dateTimeBetween('-18 months', '-1 week');

        return [
            'reference' => sprintf(
                'DOS-%s-%03d',
                date('Y', $dateOuverture->getTimestamp()),
                fake()->unique()->numberBetween(1, 999),
            ),
            'client_id' => Client::factory(),
            'titre' => fake()->sentence(6),
            'description' => fake()->paragraph(),
            'type_droit' => fake()->randomElement([
                'pénal', 'commercial', 'famille', 'fiscal', 'foncier', 'social', 'administratif',
            ]),
            'statut' => fake()->randomElement([
                StatutDossier::EnCours, StatutDossier::EnCours, StatutDossier::EnCours,
                StatutDossier::EnRevision, StatutDossier::EnAttente, StatutDossier::Cloture,
            ]),
            'priorite' => fake()->randomElement([
                PrioriteDossier::Normale, PrioriteDossier::Normale, PrioriteDossier::Normale,
                PrioriteDossier::Haute, PrioriteDossier::Urgente,
            ]),
            'avancement' => fake()->numberBetween(0, 100),
            'montant' => fake()->numberBetween(500_000, 50_000_000),
            'date_ouverture' => $dateOuverture->format('Y-m-d'),
            'date_cloture' => null,
        ];
    }

    public function cloture(): static
    {
        return $this->state(fn () => [
            'statut' => StatutDossier::Cloture,
            'avancement' => 100,
            'date_cloture' => fake()->dateTimeBetween('-3 months', 'now')->format('Y-m-d'),
        ]);
    }

    public function urgent(): static
    {
        return $this->state(fn () => [
            'priorite' => PrioriteDossier::Urgente,
        ]);
    }
}
