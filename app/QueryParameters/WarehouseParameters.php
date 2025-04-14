<?php

namespace App\QueryParameters;

class WarehouseParameters
{
    public const ALLOWED_FILTERS = [
        'name',
        'code',
        'address',
        'created_at',
    ];

    public const ALLOWED_SORTS = [
        'name',
        'code',
        'created_at',
    ];
    public const ALLOWED_INCLUDES = [
        'managers', // If you want all managers
        'manager',  // If you want just the primary manager
    ];
}
