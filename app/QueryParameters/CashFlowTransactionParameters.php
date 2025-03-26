<?php

namespace App\QueryParameters;

class CashFlowTransactionParameters
{
    public const ALLOWED_FILTERS = [
        'transaction_date',
        'transaction_type',
        'chart_of_account_id',
        'sub_cost_center_id',
        'account_id',
        'payment_method',
        'reference_number',
        'reference_type',
        'created_by',
        'updated_by'
    ];

    public const ALLOWED_SORTS = [
        'id',
        'transaction_date',
        'transaction_type',
        'amount',
        'balance_amount',
        'created_at',
        'updated_at'
    ];

    public const ALLOWED_INCLUDES = [
        'chartOfAccount',
        'subCostCenter',
        'account',
        'creator',
        'updater'
    ];
}
