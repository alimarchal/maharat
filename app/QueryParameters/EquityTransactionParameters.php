<?php

namespace App\QueryParameters;

class EquityTransactionParameters
{
    public const ALLOWED_FILTERS = [
        'equity_account_id',
        'transaction_type',
        'transaction_date',
        'reference_number',
        'created_by',
        'updated_by',
    ];

    public const ALLOWED_SORTS = [
        'id',
        'equity_account_id',
        'transaction_type',
        'amount',
        'transaction_date',
        'created_at',
        'updated_at',
    ];

    public const ALLOWED_INCLUDES = [
        'equityAccount',
        'creator',
        'updater',
    ];
}
