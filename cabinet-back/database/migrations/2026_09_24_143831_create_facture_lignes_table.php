<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('facture_lignes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facture_id')->constrained()->cascadeOnDelete();
            $table->string('designation');
            $table->unsignedInteger('quantite')->default(1);
            $table->unsignedBigInteger('prix_unitaire');
            $table->unsignedBigInteger('montant');
            $table->timestamps();

            $table->index('facture_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('facture_lignes');
    }
};
