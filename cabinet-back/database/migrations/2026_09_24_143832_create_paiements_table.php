<?php

use App\Enums\ModePaiement;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('facture_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('montant');
            $table->enum('mode', array_column(ModePaiement::cases(), 'value'));
            $table->date('date_paiement');
            $table->string('reference')->nullable()->default(null);
            $table->text('notes')->nullable()->default(null);
            $table->timestamps();

            $table->index('facture_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paiements');
    }
};
