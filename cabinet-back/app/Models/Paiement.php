<?php

namespace App\Models;

use App\Enums\ModePaiement;
use Database\Factories\PaiementFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Paiement extends Model
{
    /** @use HasFactory<PaiementFactory> */
    use HasFactory;

    /**
     * @return array<int, string>
     */
    protected $fillable = [
        'facture_id',
        'montant',
        'mode',
        'date_paiement',
        'reference',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'montant' => 'integer',
            'mode' => ModePaiement::class,
            'date_paiement' => 'date',
        ];
    }

    public function facture(): BelongsTo
    {
        return $this->belongsTo(Facture::class);
    }
}
