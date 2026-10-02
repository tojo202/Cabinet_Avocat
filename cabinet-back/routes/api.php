<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\AvocatController;
use App\Http\Controllers\Api\V1\ClientController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DocumentController;
use App\Http\Controllers\Api\V1\DossierController;
use App\Http\Controllers\Api\V1\EvenementController;
use App\Http\Controllers\Api\V1\FactureController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PaiementController;
use App\Http\Controllers\Api\V1\RapportController;
use App\Http\Controllers\Api\V1\SettingController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login'])->name('auth.login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::get('/auth/me', [AuthController::class, 'me'])->name('auth.me');

        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
        Route::get('/dashboard/activite', [DashboardController::class, 'activite']);
        Route::get('/dashboard/dossiers-recents', [DashboardController::class, 'dossiersRecents']);

        Route::get('/clients/export', [ClientController::class, 'export']);
        Route::get('/clients/stats', [ClientController::class, 'stats']);
        Route::apiResource('clients', ClientController::class);

        Route::get('/dossiers/stats', [DossierController::class, 'stats']);
        Route::patch('/dossiers/{dossier}/statut', [DossierController::class, 'changerStatut']);
        Route::get('/dossiers/{dossier}/activites', [DossierController::class, 'activites']);
        Route::post('/dossiers/{dossier}/avocats', [DossierController::class, 'synchroniserAvocats']);
        Route::apiResource('dossiers', DossierController::class);

        Route::get('/factures/stats', [FactureController::class, 'stats']);
        Route::post('/factures/{facture}/paiements', [FactureController::class, 'ajouterPaiement']);
        Route::get('/factures/{facture}/pdf', [FactureController::class, 'pdf']);
        Route::apiResource('factures', FactureController::class);

        Route::get('/paiements/stats', [PaiementController::class, 'stats']);
        Route::get('/paiements', [PaiementController::class, 'index']);

        Route::get('/documents/stats', [DocumentController::class, 'stats']);
        Route::get('/documents/{document}/download', [DocumentController::class, 'download']);
        Route::apiResource('documents', DocumentController::class)->except('update');

        Route::apiResource('evenements', EvenementController::class);
        Route::apiResource('avocats', AvocatController::class);

        Route::get('/notifications', [NotificationController::class, 'index']);

        Route::get('/settings', [SettingController::class, 'show']);
        Route::put('/settings', [SettingController::class, 'update']);

        Route::get('/rapports/synthese', [RapportController::class, 'synthese']);
        Route::get('/rapports/evolution', [RapportController::class, 'evolution']);
        Route::get('/rapports/export', [RapportController::class, 'export']);

        Route::apiResource('users', UserController::class);
    });
});
