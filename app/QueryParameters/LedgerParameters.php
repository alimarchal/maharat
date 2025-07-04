<?php

namespace App\QueryParameters;

class LedgerParameters
{
    public const ALLOWED_FILTERS = [
        'name',
        'description',
        'cost_center_id',
        'status',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at'
    ];

    public const ALLOWED_SORTS = [
        'id',
        'name',
        'description',
        'cost_center_id',
        'status',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at'
    ];

    public const ALLOWED_INCLUDES = [
        'costCenter',
        'creator',
        'updater'
    ];
}
