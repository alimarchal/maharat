<?php

namespace App\QueryParameters;

class DepartmentParameters
{
    public const ALLOWED_FILTERS = [
        'name',
        'code',
        'is_active',
        'company_id',
        'parent_id',
    ];

    public const ALLOWED_SORTS = [
        'id',
        'name',
        'code',
        'is_active',
        'created_at',
        'updated_at',
    ];

    public const ALLOWED_INCLUDES = [
        'parent',
        'children',
        'company',
    ];
}
