<?php

namespace App\Models;

use App\Enums\TypeClient;
use Database\Factories\ClientFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\HasActivity;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Client extends Model
{
    /** @use HasFactory<ClientFactory> */
    use HasActivity, HasFactory, LogsActivity, SoftDeletes;

    /**
     * @return array<int, string>
     */
    protected $fillable = [
        'type_client',
        'nom',
        'prenom',
        'raison_sociale',
        'email',
        'telephone',
        'adresse',
        'nif',
        'stat',
        'actif',
    ];

    protected function casts(): array
    {
        return [
            'type_client' => TypeClient::class,
            'actif' => 'boolean',
        ];
    }

    public function dossiers(): HasMany
    {
        return $this->hasMany(Dossier::class);
    }

    public function factures(): HasMany
    {
        return $this->hasMany(Facture::class);
    }

    public function evenements(): HasMany
    {
        return $this->hasMany(Evenement::class);
    }

    public function getNomCompletAttribute(): string
    {
        if ($this->type_client === TypeClient::Societe) {
            return $this->raison_sociale ?? $this->nom;
        }

        return trim("{$this->prenom} {$this->nom}");
    }

    public function getInitialesAttribute(): string
    {
        $nom = $this->nomComplet;
        $mots = preg_split('/\s+/', $nom) ?: [];

        return collect($mots)
            ->filter()
            ->map(fn (string $mot): string => mb_strtoupper(mb_substr($mot, 0, 1)))
            ->slice(0, 2)
            ->implode('');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['type_client', 'nom', 'prenom', 'raison_sociale', 'email', 'telephone', 'adresse', 'actif'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }
}
