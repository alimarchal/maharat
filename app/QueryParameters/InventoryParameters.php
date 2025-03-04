<?php

namespace App\QueryParameters;

class InventoryParameters
{
    public const ALLOWED_FILTERS = [
        'warehouse_id',
        'product_id',
        'quantity',
        'reorder_level',
        'description',
        'created_at',
    ];

    public const ALLOWED_SORTS = [
        'quantity',
        'reorder_level',
        'created_at',
    ];

    public const ALLOWED_INCLUDES = [
        'warehouse',
        'product',
    ];
}
