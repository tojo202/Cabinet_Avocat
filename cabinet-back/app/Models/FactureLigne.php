<?php

namespace App\Models;

use Database\Factories\FactureLigneFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FactureLigne extends Model
{
    /** @use HasFactory<FactureLigneFactory> */
    use HasFactory;

    /**
     * @return array<int, string>
     */
    protected $fillable = [
        'facture_id',
        'designation',
        'quantite',
        'prix_unitaire',
        'montant',
    ];

    protected function casts(): array
    {
        return [
            'quantite' => 'integer',
            'prix_unitaire' => 'integer',
            'montant' => 'integer',
        ];
    }

    public function facture(): BelongsTo
    {
        return $this->belongsTo(Facture::class);
    }
}
