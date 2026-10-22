<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes - Single Port Unified Laravel Serving
|--------------------------------------------------------------------------
*/
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;

Route::get('/{any?}', function () {
    $paths = [
        public_path('dist/index.html'),
        public_path('index.html'),
        base_path('dist/index.html'),
    ];

    foreach ($paths as $path) {
        if (file_exists($path) && is_readable($path)) {
            $content = file_get_contents($path);
            if ($content !== false) {
                return response($content, 200, [
                    'Content-Type' => 'text/html; charset=UTF-8',
                    'Cache-Control' => 'no-cache, no-store, must-revalidate',
                    'Pragma' => 'no-cache',
                    'Expires' => '0',
                ]);
            }
        }
    }

    return view('welcome');
})
->withoutMiddleware([
    StartSession::class,
    ShareErrorsFromSession::class,
    PreventRequestForgery::class,
])
->where('any', '^(?!api|dist|assets|storage|favicon|\..*).*$');

