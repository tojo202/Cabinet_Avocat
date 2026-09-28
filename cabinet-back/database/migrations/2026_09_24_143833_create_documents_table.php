<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('dossier_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('categorie_document_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('nom');
            $table->string('path');
            $table->string('mime_type')->nullable()->default(null);
            $table->unsignedBigInteger('taille')->default(0);
            $table->timestamps();

            $table->index('dossier_id');
            $table->index('categorie_document_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
