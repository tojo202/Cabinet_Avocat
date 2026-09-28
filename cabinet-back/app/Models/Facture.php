<?php

namespace App\Models;

use App\Enums\StatutFacture;
use Database\Factories\FactureFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\HasActivity;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class Facture extends Model
{
    /** @use HasFactory<FactureFactory> */
    use HasActivity, HasFactory, LogsActivity, SoftDeletes;

    /**
     * @return array<int, string>
     */
    protected $fillable = [
        'numero',
        'client_id',
        'dossier_id',
        'date_facture',
        'date_echeance',
        'statut',
        'montant_total',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'statut' => StatutFacture::class,
            'montant_total' => 'integer',
            'date_facture' => 'date',
            'date_echeance' => 'date',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(Dossier::class);
    }

    public function lignes(): HasMany
    {
        return $this->hasMany(FactureLigne::class);
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class);
    }

    public function getMontantPayeAttribute(): int
    {
        return (int) $this->paiements()->sum('montant');
    }

    public function getSoldeAttribute(): int
    {
        return (int) $this->montant_total - $this->montantPaye;
    }

    /**
     * Le statut "en retard" est dérivé de date_echeance, jamais saisi manuellement.
     */
    public function isEnRetard(): bool
    {
        if (in_array($this->statut, [StatutFacture::Payee, StatutFacture::Annulee, StatutFacture::Brouillon], true)) {
            return false;
        }

        return $this->date_echeance?->isPast();
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['numero', 'client_id', 'dossier_id', 'date_facture', 'date_echeance', 'statut', 'montant_total'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }
}
