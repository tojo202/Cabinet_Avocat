<?php

use App\Enums\PrioriteDossier;
use App\Enums\StatutDossier;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dossiers', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->string('titre');
            $table->text('description')->nullable()->default(null);
            $table->string('type_droit');
            $table->enum('statut', array_column(StatutDossier::cases(), 'value'))->default(StatutDossier::EnCours->value);
            $table->enum('priorite', array_column(PrioriteDossier::cases(), 'value'))->default(PrioriteDossier::Normale->value);
            $table->unsignedTinyInteger('avancement')->default(0);
            $table->unsignedBigInteger('montant')->nullable()->default(null);
            $table->date('date_ouverture');
            $table->date('date_cloture')->nullable()->default(null);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['client_id', 'statut']);
            $table->index('statut');
            $table->index('type_droit');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dossiers');
    }
};
