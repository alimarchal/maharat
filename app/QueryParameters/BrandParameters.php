<?php

namespace App\QueryParameters;

class BrandParameters
{
    /**
     * All filter fields allowed for brands
     */
    public const ALLOWED_FILTERS = [
        'id',
        'name',
        'user_id',
        'category_id',
        'status_id',
        'created_at',
        'updated_at'
    ];

    /**
     * All sort fields allowed for brands
     */
    public const ALLOWED_SORTS = [
        'id',
        'name',
        'user_id',
        'category_id',
        'status_id',
        'created_at',
        'updated_at'
    ];

    /**
     * All relationships that can be included for brands
     */
    public const ALLOWED_INCLUDES = [
        'creator',
        'category',
        'status'
    ];
}
