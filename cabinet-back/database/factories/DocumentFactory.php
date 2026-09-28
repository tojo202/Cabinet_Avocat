<?php

namespace Database\Factories;

use App\Models\CategorieDocument;
use App\Models\Document;
use App\Models\Dossier;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Document>
 */
class DocumentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $nom = fake()->randomElement([
            'Conclusions', 'Assignation', 'Contrat', 'Procès-verbal',
            'Correspondance', 'Pièce de procédure', 'Quittance',
        ]).' '.fake()->numberBetween(1, 100).'.pdf';

        return [
            'dossier_id' => fake()->boolean(80) ? Dossier::factory() : null,
            'categorie_document_id' => CategorieDocument::factory(),
            'user_id' => User::factory(),
            'nom' => $nom,
            'path' => 'documents/'.fake()->uuid().'/'.$nom,
            'mime_type' => fake()->randomElement([
                'application/pdf', 'image/png', 'image/jpeg',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ]),
            'taille' => fake()->numberBetween(10_000, 15_000_000),
        ];
    }
}
