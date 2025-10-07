<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_filter([
        env('FRONTEND_URL'),
        env('FRONTEND_URL_2'),
        'http://localhost',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:8000',
        'https://maharattraining.websoft.asia',
        'https://www.maharattraining.websoft.asia',
    ]),

    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'], // Or at least include 'Authorization', 'Content-Type'
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
