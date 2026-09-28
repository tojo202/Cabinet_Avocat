<?php

namespace App\Providers;

use App\Models\Dossier;
use App\Observers\DossierObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Dossier::observe(DossierObserver::class);
    }
}
