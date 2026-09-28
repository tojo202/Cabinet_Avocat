<?php

namespace App\Models;

use App\Enums\PrioriteDossier;
use App\Enums\StatutDossier;
use App\Enums\TypeEvenement;
use Database\Factories\DossierFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\HasActivity;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Dossier extends Model
{
    /** @use HasFactory<DossierFactory> */
    use HasActivity, HasFactory, LogsActivity, SoftDeletes;

    /**
     * @return array<int, string>
     */
    protected $fillable = [
        'reference',
        'client_id',
        'titre',
        'description',
        'type_droit',
        'statut',
        'priorite',
        'avancement',
        'montant',
        'date_ouverture',
        'date_cloture',
    ];

    protected function casts(): array
    {
        return [
            'statut' => StatutDossier::class,
            'priorite' => PrioriteDossier::class,
            'avancement' => 'integer',
            'montant' => 'integer',
            'date_ouverture' => 'date',
            'date_cloture' => 'date',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function avocats(): BelongsToMany
    {
        return $this->belongsToMany(Avocat::class, 'dossier_avocat')
            ->withPivot('role')
            ->withTimestamps();
    }

    public function evenements(): HasMany
    {
        return $this->hasMany(Evenement::class);
    }

    public function factures(): HasMany
    {
        return $this->hasMany(Facture::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    /**
     * Un dossier est en retard si une échéance liée est dépassée
     * et que le dossier n'est pas clôturé.
     */
    public function isEnRetard(): bool
    {
        if ($this->statut === StatutDossier::Cloture) {
            return false;
        }

        return $this->evenements()
            ->where('type', TypeEvenement::Echeance->value)
            ->where('debut', '<', now())
            ->exists();
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['reference', 'client_id', 'titre', 'type_droit', 'statut', 'priorite', 'avancement', 'montant', 'date_ouverture', 'date_cloture'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }
}
