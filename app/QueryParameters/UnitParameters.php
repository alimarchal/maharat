<?php

namespace App\QueryParameters;

class UnitParameters
{
    public const ALLOWED_FILTERS = [
        'name',
        'created_at',
    ];

    public const ALLOWED_FILTERS_EXACT = [
        'name',
        'short_title',
    ];

    public const ALLOWED_SORTS = [
        'name',
        'created_at',
    ];

    public const ALLOWED_INCLUDES = [];
}
