<?php

namespace App\QueryParameters;

class EquityAccountParameters
{
    public const ALLOWED_FILTERS = [
        'name',
        'account_code',
        'type',
        'is_active',
        'created_by',
        'updated_by',
    ];

    public const ALLOWED_SORTS = [
        'id',
        'name',
        'account_code',
        'type',
        'is_active',
        'created_at',
        'updated_at',
    ];

    public const ALLOWED_INCLUDES = [
        'creator',
        'updater',
    ];
}
