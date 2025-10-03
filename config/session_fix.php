<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Session Fix Configuration for ScalaHosting
    |--------------------------------------------------------------------------
    |
    | This configuration helps prevent session-related redirect loops
    | and other issues specific to ScalaHosting environment.
    |
    */

    // Routes that should never trigger session regeneration
    'protected_routes' => [
        '/',
        'login',
        'login/*',
        'dashboard',
        'dashboard/*',
        'logout',
        'api/*'
    ],

    // Headers that indicate requests that should not trigger session regeneration
    'protected_headers' => [
        'X-Inertia',
        'X-Requested-With'
    ],

    // Enable/disable session debugging
    'debug_sessions' => env('SESSION_DEBUG', false),

    // Enable/disable aggressive session fixes
    'aggressive_fixes' => env('SESSION_AGGRESSIVE_FIXES', false),
];
