<?php

namespace App\Http\Requests;

use App\Enums\TypeEvenement;
use App\Models\Evenement;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EvenementRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        $model = $this->route('evenement');

        if ($model instanceof Evenement) {
            return $user->can('update', $model);
        }

        return $user->can('create', Evenement::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'titre' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::enum(TypeEvenement::class)],
            'debut' => ['required', 'date'],
            'fin' => ['nullable', 'date', 'after:debut'],
            'dossier_id' => ['nullable', 'integer', Rule::exists('dossiers', 'id')],
            'client_id' => ['nullable', 'integer', Rule::exists('clients', 'id')],
            'lieu' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ];
    }
}
