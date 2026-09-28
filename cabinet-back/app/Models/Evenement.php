<?php

namespace App\Models;

use App\Enums\TypeEvenement;
use Database\Factories\EvenementFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Evenement extends Model
{
    /** @use HasFactory<EvenementFactory> */
    use HasFactory;

    /**
     * @return array<int, string>
     */
    protected $fillable = [
        'dossier_id',
        'client_id',
        'titre',
        'type',
        'debut',
        'fin',
        'lieu',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'type' => TypeEvenement::class,
            'debut' => 'datetime',
            'fin' => 'datetime',
        ];
    }

    public function dossier(): BelongsTo
    {
        return $this->belongsTo(Dossier::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
