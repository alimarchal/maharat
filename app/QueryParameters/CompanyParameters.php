<?php

namespace App\QueryParameters;

class CompanyParameters
{
    public const ALLOWED_FILTERS = [
        'name',
        'email',
        'country',
        'city',
        'business_category',
        'zatca_environment',
    ];

    public const ALLOWED_SORTS = [
        'id',
        'name',
        'email',
        'created_at',
        'updated_at',
    ];

    public const ALLOWED_INCLUDES = [
        'users',
        'departments',
        'branches',
    ];
}
