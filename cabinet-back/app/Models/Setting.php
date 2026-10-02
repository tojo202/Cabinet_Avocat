<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    /**
     * Valeurs par défaut, utilisées comme base tant qu'une clé n'a pas été enregistrée.
     *
     * @var array<string, string>
     */
    public const DEFAUTS = [
        'nom_cabinet' => 'CabinetPro',
        'raison_sociale' => '',
        'adresse' => '',
        'telephone' => '',
        'email' => '',
        'devise' => 'MGA',
        'fuseau' => 'Indian/Antananarivo',
        'en_tete_facture' => '',
    ];

    /**
     * @return array<int, string>
     */
    protected $fillable = [
        'cle',
        'valeur',
    ];

    protected function casts(): array
    {
        return [
            'valeur' => 'string',
        ];
    }

    /**
     * Toutes les valeurs connues (défauts + base de données).
     *
     * @return array<string, string>
     */
    public static function valeurs(): array
    {
        $valeurs = self::DEFAUTS;

        foreach (self::query()->get() as $setting) {
            if (array_key_exists($setting->cle, $valeurs)) {
                $valeurs[$setting->cle] = (string) ($setting->valeur ?? '');
            }
        }

        return $valeurs;
    }

    /**
     * Enregistre (ou remplace) les clés autorisées.
     *
     * @param  array<string, mixed>  $parametres
     */
    public static function enregistrer(array $parametres): void
    {
        foreach ($parametres as $cle => $valeur) {
            if (! array_key_exists($cle, self::DEFAUTS)) {
                continue;
            }

            self::query()->updateOrCreate(
                ['cle' => $cle],
                ['valeur' => $valeur === null ? '' : (string) $valeur],
            );
        }
    }
}
