<?php

/**
 * Vercel Serverless Function Bridge for Laravel Fullstack
 */

// 1. Prepare temporary writable storage structure in /tmp
$storagePath = '/tmp/storage';
$dirs = [
    $storagePath . '/framework/views',
    $storagePath . '/framework/cache/data',
    $storagePath . '/framework/sessions',
    $storagePath . '/logs',
    $storagePath . '/app/public',
];

foreach ($dirs as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
}

// 2. Set environment parameters for serverless runtime
putenv("VERCEL=1");
putenv("VIEW_COMPILED_PATH={$storagePath}/framework/views");
putenv("APP_CONFIG_CACHE={$storagePath}/framework/cache/config.php");
putenv("APP_SERVICES_CACHE={$storagePath}/framework/cache/services.php");
putenv("APP_PACKAGES_CACHE={$storagePath}/framework/cache/packages.php");
putenv("APP_ROUTES_CACHE={$storagePath}/framework/cache/routes.php");

// 3. Fallback Supabase Cloud Environment Variables
if (!getenv('DB_HOST')) {
    putenv("DB_CONNECTION=pgsql");
    putenv("DB_HOST=aws-0-ap-southeast-2.pooler.supabase.com");
    putenv("DB_PORT=6543");
    putenv("DB_DATABASE=postgres");
    putenv("DB_USERNAME=postgres.hwrwsevzxqaqrjnxhnrg");
    putenv("DB_PASSWORD=Tkq4elfhemR5ztMM");
    putenv("DB_SSLMODE=require");
}
if (!getenv('APP_KEY')) {
    putenv("APP_KEY=base64:jJcy4arwNxl3XEPDbrMjdIXpXX+7mKFXI9oGmnimmp4=");
}
if (!getenv('APP_ENV')) {
    putenv("APP_ENV=production");
}

// 4. Normalize script name so Laravel correctly matches /api/* routes
$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['PHP_SELF'] = '/index.php';

// 5. Delegate execution to Laravel public/index.php
require __DIR__ . '/../public/index.php';
