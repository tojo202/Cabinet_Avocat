<?php

namespace App\OpenApi;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: '1.0.0',
    title: 'CabinetPro API',
    description: 'API REST de gestion de cabinet d\'avocat — CabinetPro.'
)]
#[OA\Server(url: '/api/v1', description: 'API v1')]
class OpenApiInfo {}
