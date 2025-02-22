<?php

namespace App\QueryParameters;

class BrandParameters
{
    /**
     * All filter fields allowed for brands
     */
    public const ALLOWED_FILTERS = [
        'name',
        'code',
        'status_id'
    ];

    /**
     * All sort fields allowed for brands
     */
    public const ALLOWED_SORTS = [
        'name',
        'code',
        'created_at',
        'updated_at'
    ];

    /**
     * All relationships that can be included for brands
     */
    public const ALLOWED_INCLUDES = [
        'status'
    ];
}
