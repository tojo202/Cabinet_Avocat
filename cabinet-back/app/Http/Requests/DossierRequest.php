<?php

namespace App\Http\Requests;

use App\Enums\PrioriteDossier;
use App\Enums\StatutDossier;
use App\Models\Dossier;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DossierRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        $model = $this->route('dossier');

        if ($model instanceof Dossier) {
            return $user->can('update', $model);
        }

        return $user->can('create', Dossier::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $dossierId = $this->route('dossier')?->id ?? $this->route('dossier');

        return [
            'client_id' => ['required', 'integer', Rule::exists('clients', 'id')],
            'titre' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'type_droit' => ['required', 'string', 'max:100'],
            'statut' => ['sometimes', Rule::enum(StatutDossier::class)],
            'priorite' => ['sometimes', Rule::enum(PrioriteDossier::class)],
            'avancement' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'montant' => ['nullable', 'integer', 'min:0'],
            'date_ouverture' => ['required', 'date', 'before_or_equal:today'],
            'date_cloture' => ['nullable', 'date', 'after_or_equal:date_ouverture'],
            'avocat_ids' => ['sometimes', 'array'],
            'avocat_ids.*' => ['integer', Rule::exists('avocats', 'id')],
        ];
    }
}
