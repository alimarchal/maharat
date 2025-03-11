<?php

namespace App\QueryParameters;

class DesignationParameters
{
    public const ALLOWED_FILTERS = [
        'designation',
        'created_at',
        'updated_at'
    ];

    public const ALLOWED_SORTS = [
        'id',
        'designation',
        'created_at',
        'updated_at'
    ];

    public const ALLOWED_INCLUDES = [];
}
