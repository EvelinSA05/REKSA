<?php

namespace App\Providers;

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
        ini_set('memory_limit', '512M');

        \App\Models\KebutuhanWarga::saved(function () {
            \Illuminate\Support\Facades\Cache::forget('api_kebutuhan_index');
            \Illuminate\Support\Facades\Cache::forget('api_bursa_index');
        });
        \App\Models\KebutuhanWarga::deleted(function () {
            \Illuminate\Support\Facades\Cache::forget('api_kebutuhan_index');
            \Illuminate\Support\Facades\Cache::forget('api_bursa_index');
        });

        \App\Models\BursaBantuan::saved(function () {
            \Illuminate\Support\Facades\Cache::forget('api_bursa_index');
            \Illuminate\Support\Facades\Cache::forget('api_kebutuhan_index');
        });
        \App\Models\BursaBantuan::deleted(function () {
            \Illuminate\Support\Facades\Cache::forget('api_bursa_index');
        });

        \App\Models\MisiPenyaluran::saved(function () {
            \Illuminate\Support\Facades\Cache::forget('api_misi_index');
            \Illuminate\Support\Facades\Cache::forget('api_kebutuhan_index');
        });
        \App\Models\MisiPenyaluran::deleted(function () {
            \Illuminate\Support\Facades\Cache::forget('api_misi_index');
        });

        \App\Models\PenawaranMitra::saved(function () {
            \Illuminate\Support\Facades\Cache::forget('api_penawaran_index');
            \Illuminate\Support\Facades\Cache::forget('api_bursa_index');
        });
        \App\Models\PenawaranMitra::deleted(function () {
            \Illuminate\Support\Facades\Cache::forget('api_penawaran_index');
        });

        \App\Models\LogAktivitas::saved(function () {
            \Illuminate\Support\Facades\Cache::forget('api_activity_logs_index');
        });
    }
}
