<?php

namespace App\QueryParameters;

class AssetParameters
{
    public const ALLOWED_FILTERS = [
        'name',
        'asset_code',
        'type',
        'status',
        'acquisition_date',
        'disposal_date',
        'location',
        'department',
        'is_leased',
    ];

    public const ALLOWED_SORTS = [
        'id',
        'name',
        'asset_code',
        'type',
        'status',
        'acquisition_cost',
        'current_value',
        'acquisition_date',
        'disposal_date',
        'created_at',
        'updated_at',
    ];

    public const ALLOWED_INCLUDES = [];
}
