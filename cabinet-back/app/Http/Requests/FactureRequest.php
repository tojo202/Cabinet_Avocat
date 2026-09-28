<?php

namespace App\Http\Requests;

use App\Enums\StatutFacture;
use App\Models\Facture;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FactureRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        $model = $this->route('facture');

        if ($model instanceof Facture) {
            return $user->can('update', $model);
        }

        return $user->can('create', Facture::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $factureId = $this->route('facture')?->id ?? $this->route('facture');

        return [
            'client_id' => ['required', 'integer', Rule::exists('clients', 'id')],
            'dossier_id' => ['nullable', 'integer', Rule::exists('dossiers', 'id')],
            'date_facture' => ['required', 'date'],
            'date_echeance' => ['required', 'date', 'after_or_equal:date_facture'],
            'statut' => ['sometimes', Rule::enum(StatutFacture::class)],
            'notes' => ['nullable', 'string'],
            'lignes' => ['required', 'array', 'min:1'],
            'lignes.*.designation' => ['required', 'string', 'max:255'],
            'lignes.*.quantite' => ['required', 'integer', 'min:1'],
            'lignes.*.prix_unitaire' => ['required', 'integer', 'min:0'],
        ];
    }
}
