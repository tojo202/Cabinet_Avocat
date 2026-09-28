<?php

namespace Database\Seeders;

use App\Models\Avocat;
use App\Models\User;
use Illuminate\Database\Seeder;

class AvocatSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $avocats = [
            ['email' => 'hery@cabinet.mg', 'nom' => 'Andria', 'prenom' => 'Hery', 'specialite' => 'Droit pénal', 'barreau' => 'Antananarivo'],
            ['email' => 'miora@cabinet.mg', 'nom' => 'Rasoa', 'prenom' => 'Miora', 'specialite' => 'Droit commercial', 'barreau' => 'Antananarivo'],
            ['email' => 'jp@cabinet.mg', 'nom' => 'Rakoto', 'prenom' => 'Jean Pierre', 'specialite' => 'Droit de la famille', 'barreau' => 'Toamasina'],
        ];

        foreach ($avocats as $data) {
            $user = User::where('email', $data['email'])->first();

            if ($user) {
                Avocat::firstOrCreate(
                    ['user_id' => $user->id],
                    [
                        'nom' => $data['nom'],
                        'prenom' => $data['prenom'],
                        'specialite' => $data['specialite'],
                        'barreau' => $data['barreau'],
                        'telephone' => '+261 34 12 34 56',
                        'actif' => true,
                    ],
                );
            }
        }

        Avocat::factory()->count(3)->create();
    }
}
