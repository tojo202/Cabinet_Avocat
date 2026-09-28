<?php

namespace Database\Seeders;

use App\Enums\TypeClient;
use App\Models\Client;
use Illuminate\Database\Seeder;

class ClientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $particuliers = [
            ['nom' => 'Rakotoarisoa', 'prenom' => 'Fianja', 'email' => 'fianja.rakotoarisoa@mail.mg', 'telephone' => '+261 34 11 22 33', 'adresse' => 'Antananarivo 101, Ankorondrano'],
            ['nom' => 'Rasoa', 'prenom' => 'Hanitra', 'email' => 'hanitra.rasoa@mail.mg', 'telephone' => '+261 32 44 55 66', 'adresse' => 'Antananarivo 101, Ambohijatovo'],
            ['nom' => 'Andrianina', 'prenom' => 'Tahina', 'email' => 'tahina.andrianina@mail.mg', 'telephone' => '+261 33 77 88 99', 'adresse' => 'Toamasina 201, Analakely'],
            ['nom' => 'Ramanantsoa', 'prenom' => 'Voahangy', 'email' => 'voahangy.ramanantsoa@mail.mg', 'telephone' => '+261 34 21 43 65', 'adresse' => 'Antsirabe 110, Ambatolampy'],
            ['nom' => 'Haja', 'prenom' => 'Nirina', 'email' => 'nirina.haja@mail.mg', 'telephone' => '+261 32 87 65 43', 'adresse' => 'Antananarivo 101, Ivandry'],
            ['nom' => 'Razafy', 'prenom' => 'Sitraka', 'email' => 'sitraka.razafy@mail.mg', 'telephone' => '+261 33 10 20 30', 'adresse' => 'Mahajanga 401, Tsaramandroso'],
            ['nom' => 'Ranaivohary', 'prenom' => 'Mamy', 'email' => 'mamy.ranaivohary@mail.mg', 'telephone' => '+261 34 55 66 77', 'adresse' => 'Fianarantsoa 301, Ambalavao'],
            ['nom' => 'Rakoto', 'prenom' => 'Hery', 'email' => 'hery.rakoto@mail.mg', 'telephone' => '+261 32 90 80 70', 'adresse' => 'Antananarivo 101, Behoririka'],
        ];

        foreach ($particuliers as $data) {
            Client::firstOrCreate(
                ['email' => $data['email']],
                $data + ['type_client' => TypeClient::Particulier->value, 'actif' => true],
            );
        }

        $societes = [
            ['raison_sociale' => 'Société Rakoto Distribution SARL', 'nom' => 'Rakoto Distribution', 'email' => 'contact@rakotodistribution.mg', 'telephone' => '+261 20 22 33 44', 'adresse' => 'Antananarivo 101, Lot II M 34 Antsakaviro', 'nif' => '40012345678', 'stat' => '1234567'],
            ['raison_sociale' => 'Madagascar Tech Services SA', 'nom' => 'Madagascar Tech Services', 'email' => 'info@mts.mg', 'telephone' => '+261 20 22 55 66', 'adresse' => 'Antananarivo 101, Rue Rainandriamampandry', 'nif' => '40098765432', 'stat' => '7654321'],
            ['raison_sociale' => 'ETS Ranaivo et Fils EURL', 'nom' => 'Ranaivo et Fils', 'email' => 'ranaivo.fils@mail.mg', 'telephone' => '+261 33 44 22 11', 'adresse' => 'Toamasina 201, Rue du 13 Décembre', 'nif' => '40011223344', 'stat' => '2233445'],
            ['raison_sociale' => 'Société Agro-Vie SARLU', 'nom' => 'Agro-Vie', 'email' => 'contact@agrovie.mg', 'telephone' => '+261 20 24 68 10', 'adresse' => 'Antsirabe 110, RN 7 Km 3', 'nif' => '40055667788', 'stat' => '5566778'],
            ['raison_sociale' => 'Groupe Immo Plus SA', 'nom' => 'Immo Plus', 'email' => 'contact@immoplus.mg', 'telephone' => '+261 20 22 77 88', 'adresse' => 'Antananarivo 101, Lot II A 42 Ivandry', 'nif' => '40099887766', 'stat' => '9988776'],
            ['raison_sociale' => 'Trans-Essa SARL', 'nom' => 'Trans-Essa', 'email' => 'logistique@transessa.mg', 'telephone' => '+261 20 25 15 25', 'adresse' => 'Toamasina 201, Port, Zone industrielle', 'nif' => '40013572468', 'stat' => '1357246'],
        ];

        foreach ($societes as $data) {
            Client::firstOrCreate(
                ['email' => $data['email']],
                $data + ['type_client' => TypeClient::Societe->value, 'actif' => true],
            );
        }

        Client::factory()->count(6)->create();
    }
}
