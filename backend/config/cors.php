<?php

return [
    'paths'                    => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods'          => ['*'],
    'allowed_origins'          => [
        'http://localhost:5173',   // React web
        'http://127.0.0.1:5173',   // React web (IP)
        'http://localhost:5175',   // Flutter web
        'http://127.0.0.1:5175',   // Flutter web (IP)
    ],
    'allowed_origins_patterns' => [],
    'allowed_headers'          => ['*'],
    'exposed_headers'          => [],
    'max_age'                  => 0,
    'supports_credentials'     => false,
];
