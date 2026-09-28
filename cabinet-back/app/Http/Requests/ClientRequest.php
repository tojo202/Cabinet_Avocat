<?php

namespace App\Http\Requests;

use App\Enums\TypeClient;
use App\Models\Client;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        $model = $this->route('client');

        if ($model instanceof Client) {
            return $user->can('update', $model);
        }

        return $user->can('create', Client::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $clientId = $this->route('client')?->id ?? $this->route('client');

        return [
            'type_client' => ['required', Rule::enum(TypeClient::class)],
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['nullable', 'string', 'max:255', 'required_if:type_client,particulier'],
            'raison_sociale' => ['nullable', 'string', 'max:255', 'required_if:type_client,societe'],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('clients', 'email')->ignore($clientId)],
            'telephone' => ['nullable', 'string', 'max:30'],
            'adresse' => ['nullable', 'string', 'max:255'],
            'nif' => ['nullable', 'string', 'max:20'],
            'stat' => ['nullable', 'string', 'max:20'],
            'actif' => ['boolean'],
        ];
    }
}
