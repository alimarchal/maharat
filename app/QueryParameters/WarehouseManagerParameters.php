<?php

namespace App\QueryParameters;

class WarehouseManagerParameters
{
    public const ALLOWED_FILTERS = [
        'warehouse_id',
        'manager_id',
    ];

    public const ALLOWED_SORTS = [
        'id',
        'created_at',
        'updated_at',
    ];

    public const ALLOWED_INCLUDES = [
        'warehouse',
        'manager',
    ];
}
