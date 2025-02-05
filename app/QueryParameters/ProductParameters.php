<?php

namespace App\QueryParameters;

class ProductParameters
{
    public const ALLOWED_FILTERS = [
        'name',
        'upc',
        'category_id',
        'unit_id',
        'created_at',
    ];

    public const ALLOWED_SORTS = [
        'name',
        'upc',
        'created_at',
    ];

    public const ALLOWED_INCLUDES = [
        'category',
        'unit',
    ];
}
