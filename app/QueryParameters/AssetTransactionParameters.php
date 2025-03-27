<?php

namespace App\QueryParameters;

class AssetTransactionParameters
{
    public const ALLOWED_FILTERS = [
        'asset_id',
        'transaction_type',
        'transaction_date',
        'reference_number',
        'created_by',
    ];

    public const ALLOWED_SORTS = [
        'id',
        'asset_id',
        'transaction_type',
        'amount',
        'transaction_date',
        'created_at',
        'updated_at',
    ];

    public const ALLOWED_INCLUDES = [
        'asset',
        'creator',
    ];
}
