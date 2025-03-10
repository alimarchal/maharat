<?php

namespace App\QueryParameters;

class ChartOfAccountParameters
{
    const ALLOWED_FILTERS = [
        'parent_id',
        'account_code_id',
        'account_name',
        'is_active',
        'description'
    ];

    const ALLOWED_SORTS = [
        'id',
        'parent_id',
        'account_code_id',
        'account_name',
        'is_active',
        'description',
        'created_at',
        'updated_at'
    ];

    const ALLOWED_INCLUDES = [
        'parent',
        'children',
        'descendants'
    ];
}
