<?php

return [
    /*
    |--------------------------------------------------------------------------
    | ScalaHosting Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration specific to ScalaHosting environment to work around
    | their hosting limitations and session handling issues.
    |
    */

    // Enable ScalaHosting specific fixes
    'enabled' => env('SCALAHOSTING_FIXES', str_contains(config('app.url'), 'maharattraining.websoft.asia')),

    // Session fixes
    'session' => [
        'force_database_sessions' => true,
        'ensure_session_records' => true,
        'fix_cookie_domain' => true,
        'handle_missing_sessions' => true,
    ],

    // Cookie fixes
    'cookies' => [
        'force_secure' => true,
        'fix_domain' => '.maharattraining.websoft.asia',
        'same_site' => 'lax',
        'http_only' => true,
    ],

    // Error handling
    'error_handling' => [
        'graceful_recovery' => true,
        'log_errors' => true,
        'fallback_responses' => true,
    ],

    // Debug settings
    'debug' => [
        'log_session_fixes' => env('SCALAHOSTING_DEBUG', false),
        'detailed_errors' => env('APP_DEBUG', false),
    ],
];
