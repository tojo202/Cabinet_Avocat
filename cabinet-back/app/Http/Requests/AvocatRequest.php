<?php

namespace App\Http\Requests;

use App\Models\Avocat;
use Illuminate\Foundation\Http\FormRequest;

class AvocatRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        $model = $this->route('avocat');

        if ($model instanceof Avocat) {
            return $user->can('update', $model);
        }

        return $user->can('create', Avocat::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $avocatId = $this->route('avocat')?->id ?? $this->route('avocat');

        return [
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['required', 'string', 'max:255'],
            'specialite' => ['nullable', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:30'],
            'barreau' => ['nullable', 'string', 'max:100'],
            'actif' => ['boolean'],
            'email' => ($avocatId ? 'sometimes' : 'required').'|email|max:255|unique:users,email',
            'password' => ($avocatId ? 'sometimes' : 'required').'|string|min:8',
        ];
    }
}
