<?php

namespace App\QueryParameters;

class StatusParameters
{
    public const ALLOWED_FILTERS = [
        'type',
        'name',
        'created_at',
    ];

    public const ALLOWED_SORTS = [
        'type',
        'name',
        'created_at',
    ];

    public const ALLOWED_INCLUDES = [];
}
