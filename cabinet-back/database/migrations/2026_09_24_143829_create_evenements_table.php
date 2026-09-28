<?php

use App\Enums\TypeEvenement;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evenements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dossier_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->string('titre');
            $table->enum('type', array_column(TypeEvenement::cases(), 'value'));
            $table->timestamp('debut');
            $table->timestamp('fin')->nullable()->default(null);
            $table->string('lieu')->nullable()->default(null);
            $table->text('description')->nullable()->default(null);
            $table->timestamps();

            $table->index('debut');
            $table->index('type');
            $table->index('dossier_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evenements');
    }
};
