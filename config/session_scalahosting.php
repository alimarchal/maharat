<?php

/*
|--------------------------------------------------------------------------
| Simple Session Configuration for ScalaHosting
|--------------------------------------------------------------------------
|
| This file contains the session configuration specifically optimized
| for ScalaHosting environment to prevent redirect loops.
|
*/

return [
    'driver' => env('SESSION_DRIVER', 'database'),
    'lifetime' => env('SESSION_LIFETIME', 1440),
    'expire_on_close' => false,
    'encrypt' => false,
    'files' => storage_path('framework/sessions'),
    'connection' => env('SESSION_CONNECTION'),
    'table' => 'sessions',
    'store' => env('SESSION_STORE'),
    'lottery' => [2, 100],
    'cookie' => env('SESSION_COOKIE', 'maharat_session'),
    'path' => '/',
    'domain' => env('SESSION_DOMAIN', '.maharattraining.websoft.asia'),
    'secure' => env('SESSION_SECURE_COOKIE', true),
    'http_only' => true,
    'same_site' => 'lax',
    'partitioned' => false,
];
