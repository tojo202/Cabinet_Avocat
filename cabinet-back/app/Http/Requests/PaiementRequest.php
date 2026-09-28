<?php

namespace App\Http\Requests;

use App\Enums\ModePaiement;
use App\Models\Facture;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PaiementRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        $facture = $this->route('facture');

        if (! $user || ! $facture instanceof Facture) {
            return false;
        }

        return $user->can('addPaiement', $facture);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'montant' => ['required', 'integer', 'min:1'],
            'mode' => ['required', Rule::enum(ModePaiement::class)],
            'date_paiement' => ['required', 'date'],
            'reference' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
