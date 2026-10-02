<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class SettingController extends Controller
{
    #[OA\Get(
        path: '/api/v1/settings',
        summary: 'Paramètres système du cabinet',
        tags: ['Paramètres'],
        security: [['sanctum' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Paramètres du cabinet'),
            new OA\Response(response: 403, description: 'Droit « parametres.manage » requis'),
        ]
    )]
    public function show(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('parametres.manage'), 403);

        return response()->json(['data' => Setting::valeurs()]);
    }

    #[OA\Put(
        path: '/api/v1/settings',
        summary: 'Enregistrer les paramètres système du cabinet',
        tags: ['Paramètres'],
        security: [['sanctum' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(
                        property: 'parametres',
                        type: 'object',
                        additionalProperties: true,
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Paramètres enregistrés'),
            new OA\Response(response: 403, description: 'Droit « parametres.manage » requis'),
            new OA\Response(response: 422, description: 'Données invalides'),
        ]
    )]
    public function update(Request $request): JsonResponse
    {
        abort_unless($request->user()->can('parametres.manage'), 403);

        $validated = $request->validate([
            'parametres' => ['required', 'array:'.implode(',', array_keys(Setting::DEFAUTS))],
            'parametres.*' => ['nullable', 'string', 'max:2000'],
        ]);

        Setting::enregistrer($validated['parametres']);

        return response()->json([
            'data' => Setting::valeurs(),
            'message' => 'Paramètres enregistrés.',
        ]);
    }
}
