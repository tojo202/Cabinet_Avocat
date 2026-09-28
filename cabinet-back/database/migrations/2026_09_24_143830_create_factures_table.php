<?php

use App\Enums\StatutFacture;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique();
            $table->foreignId('client_id')->constrained()->cascadeOnDelete();
            $table->foreignId('dossier_id')->nullable()->constrained()->nullOnDelete();
            $table->date('date_facture');
            $table->date('date_echeance');
            $table->enum('statut', array_column(StatutFacture::cases(), 'value'))->default(StatutFacture::Brouillon->value);
            $table->unsignedBigInteger('montant_total')->default(0);
            $table->text('notes')->nullable()->default(null);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['statut', 'date_echeance']);
            $table->index('client_id');
            $table->index('dossier_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('factures');
    }
};
