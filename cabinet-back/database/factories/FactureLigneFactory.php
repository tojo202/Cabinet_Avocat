<?php

namespace Database\Factories;

use App\Models\Facture;
use App\Models\FactureLigne;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FactureLigne>
 */
class FactureLigneFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantite = fake()->numberBetween(1, 10);
        $prixUnitaire = fake()->numberBetween(50_000, 5_000_000);

        return [
            'facture_id' => Facture::factory(),
            'designation' => fake()->randomElement([
                'Honoraires de consultation',
                'Assistance en audience',
                'Rédaction d\'acte',
                'Frais de procédure',
                'Déplacement',
                'Conseil juridique',
            ]),
            'quantite' => $quantite,
            'prix_unitaire' => $prixUnitaire,
            'montant' => $quantite * $prixUnitaire,
        ];
    }
}
