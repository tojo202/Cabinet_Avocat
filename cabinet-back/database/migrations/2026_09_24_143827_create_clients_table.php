<?php

use App\Enums\TypeClient;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->enum('type_client', [TypeClient::Particulier->value, TypeClient::Societe->value]);
            $table->string('nom')->nullable()->default(null);
            $table->string('prenom')->nullable()->default(null);
            $table->string('raison_sociale')->nullable()->default(null);
            $table->string('email')->nullable()->default(null);
            $table->string('telephone')->nullable()->default(null);
            $table->string('adresse')->nullable()->default(null);
            $table->string('nif')->nullable()->default(null);
            $table->string('stat')->nullable()->default(null);
            $table->boolean('actif')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique('email');
            $table->index('type_client');
        });

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');
            DB::statement('CREATE INDEX clients_nom_trgm_idx ON clients USING gin (nom gin_trgm_ops)');
            DB::statement('CREATE INDEX clients_email_trgm_idx ON clients USING gin (email gin_trgm_ops)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
