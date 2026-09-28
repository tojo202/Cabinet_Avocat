<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            ['name' => 'Tiana Rakoto', 'email' => 'admin@cabinet.mg', 'role' => 'admin'],
            ['name' => 'Hery Andria', 'email' => 'hery@cabinet.mg', 'role' => 'avocat'],
            ['name' => 'Miora Rasoa', 'email' => 'miora@cabinet.mg', 'role' => 'avocat'],
            ['name' => 'Jean Pierre', 'email' => 'jp@cabinet.mg', 'role' => 'avocat'],
            ['name' => 'Soa Fanja', 'email' => 'secretariat@cabinet.mg', 'role' => 'secretaire'],
            ['name' => 'Naina Hery', 'email' => 'compta@cabinet.mg', 'role' => 'comptable'],
        ];

        foreach ($users as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                ],
            );

            if ($user->getRoleNames()->isEmpty() && Role::first()) {
                $user->assignRole($data['role']);
            }
        }
    }
}
