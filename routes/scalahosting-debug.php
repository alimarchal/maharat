<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

// ScalaHosting diagnostic routes
Route::get('/scalahosting-debug', function (Request $request) {
    $diagnostics = [
        'timestamp' => now()->toISOString(),
        'server_info' => [
            'php_version' => PHP_VERSION,
            'laravel_version' => app()->version(),
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
            'request_method' => $request->method(),
            'request_uri' => $request->getRequestUri(),
            'http_host' => $request->getHost(),
            'remote_addr' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ],
        'session_info' => [
            'has_session' => $request->hasSession(),
            'session_started' => $request->hasSession() ? $request->session()->isStarted() : false,
            'session_id' => $request->hasSession() ? $request->session()->getId() : 'NO_SESSION',
            'session_driver' => config('session.driver'),
        ],
        'memory_info' => [
            'current_usage' => memory_get_usage(true),
            'peak_usage' => memory_get_peak_usage(true),
            'limit' => ini_get('memory_limit'),
        ],
        'headers' => $request->headers->all(),
        'cookies' => $request->cookies->all(),
        'status' => 'ScalaHosting Infrastructure Test - Laravel OK',
    ];

    $response = response()->json($diagnostics, 200);
    
    // Add diagnostic headers
    $response->headers->set('X-ScalaHosting-Test', 'SUCCESS');
    $response->headers->set('X-Laravel-Status', 'OK');
    $response->headers->set('X-PHP-Version', PHP_VERSION);
    $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return $response;
});

Route::get('/scalahosting-simple', function () {
    return response('ScalaHosting Test: Laravel is working perfectly!', 200)
        ->header('X-ScalaHosting-Test', 'SIMPLE-SUCCESS')
        ->header('X-Laravel-Status', 'OK')
        ->header('Cache-Control', 'no-cache, no-store, must-revalidate');
});
