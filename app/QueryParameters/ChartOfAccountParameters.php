<?php

namespace App\QueryParameters;

class ChartOfAccountParameters
{
    const ALLOWED_FILTERS = [
        'account_code',
        'account_name',
        'account_type',
        'is_active',
        'parent_account_id'
    ];

    const ALLOWED_SORTS = [
        'id',
        'account_code',
        'account_name',
        'account_type',
        'is_active',
        'created_at',
        'updated_at'
    ];

    const ALLOWED_INCLUDES = [
        'parent',
        'children',
        'descendants'
    ];
}
