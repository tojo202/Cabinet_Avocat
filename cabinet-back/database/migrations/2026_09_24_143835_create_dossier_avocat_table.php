<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dossier_avocat', function (Blueprint $table) {
            $table->foreignId('dossier_id')->constrained()->cascadeOnDelete();
            $table->foreignId('avocat_id')->constrained()->cascadeOnDelete();
            $table->string('role')->default('principal');
            $table->timestamps();

            $table->primary(['dossier_id', 'avocat_id']);
            $table->index('avocat_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dossier_avocat');
    }
};
