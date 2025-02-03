<?php

namespace App\QueryParameters;

class WarehouseParameters
{
    public const ALLOWED_FILTERS = [
        'name',
        'code',
        'address',
        'manager_id',
        'created_at',
    ];

    public const ALLOWED_SORTS = [
        'name',
        'code',
        'created_at',
    ];

    public const ALLOWED_INCLUDES = [
        'manager',
    ];
}
