<?php

namespace App\Models;

use Database\Factories\CategorieDocumentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CategorieDocument extends Model
{
    /** @use HasFactory<CategorieDocumentFactory> */
    use HasFactory;

    /**
     * @return array<int, string>
     */
    protected $fillable = [
        'nom',
        'description',
    ];

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }
}
