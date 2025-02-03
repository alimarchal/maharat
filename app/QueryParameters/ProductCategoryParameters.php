<?php

namespace App\QueryParameters;

class ProductCategoryParameters
{
    public const ALLOWED_FILTERS = [
        'name',
        'created_at',
    ];

    public const ALLOWED_SORTS = [
        'name',
        'created_at',
    ];

    public const ALLOWED_INCLUDES = [];
}
