<?php

namespace Database\Seeders;

use App\Enums\TypeEvenement;
use App\Models\Client;
use App\Models\Dossier;
use App\Models\Evenement;
use Illuminate\Database\Seeder;

class EvenementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $titres = [
            TypeEvenement::Audience->value => [
                'Audience de mise en état',
                'Audience de jugement',
                'Audience de référé',
                'Audience prud\'hommale',
            ],
            TypeEvenement::RendezVous->value => [
                'Rendez-vous client — analyse de dossier',
                'Réunion avec la partie adverse',
                'Signature de la procuration',
                'Consultation juridique',
            ],
            TypeEvenement::Echeance->value => [
                'Dépôt des conclusions',
                'Période de recours en appel',
                'Paiement des frais de procédure',
                'Échéance de la mise en demeure',
            ],
        ];

        for ($i = 0; $i < 25; $i++) {
            $type = fake()->randomElement(TypeEvenement::cases());
            $jourOffset = fake()->numberBetween(-20, 45);
            $debut = now()->addDays($jourOffset)->setTime(rand(8, 16), fake()->randomElement([0, 30]));

            Evenement::create([
                'dossier_id' => Dossier::inRandomOrder()->first()?->id,
                'client_id' => fake()->boolean(40) ? Client::inRandomOrder()->first()?->id : null,
                'titre' => fake()->randomElement($titres[$type->value]),
                'type' => $type->value,
                'debut' => $debut,
                'fin' => (clone $debut)->addHour(),
                'lieu' => $type === TypeEvenement::Audience
                    ? 'Tribunal de première instance d\'Antananarivo'
                    : fake()->randomElement(['Cabinet', 'Visioconférence', 'Étude du notaire']),
                'description' => fake()->boolean(50) ? fake()->sentence() : null,
            ]);
        }
    }
}
