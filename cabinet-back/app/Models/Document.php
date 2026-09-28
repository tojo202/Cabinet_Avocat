<?php

namespace App\Models;

use Database\Factories\DocumentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\Models\Concerns\HasActivity;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Document extends Model
{
    /** @use HasFactory<DocumentFactory> */
    use HasActivity, HasFactory, LogsActivity;

    /**
     * @return array<int, string>
     */
    protected $fillable = [
        'dossier_id',
        'categorie_document_id',
        'user_id',
        'nom',
        'path',
        'mime_type',
        'taille',
    ];

    protected function casts(): array
    {
        return [
            'taille' => 'integer',
        ];
    }

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(Dossier::class);
    }

    public function categorie(): BelongsTo
    {
        return $this->belongsTo(CategorieDocument::class, 'categorie_document_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['nom', 'dossier_id', 'categorie_document_id', 'path', 'taille'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }
}
