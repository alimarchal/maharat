<?php

namespace App\QueryParameters;

class FinancialTransactionParameters
{
    public const ALLOWED_FILTERS = [
        'transaction_date',
        'entry_type',
        'status',
        'reference_number',
        'amount',
        'description',
    ];

    public const ALLOWED_FILTERS_EXACT = [
        'id',
        'account_code_id',
        'chart_of_account_id',
        'account_id',
        'department_id',
        'cost_center_id',
        'sub_cost_center_id',
        'fiscal_period_id',
        'created_by',
        'updated_by',
        'approved_by',
    ];

    public const ALLOWED_SORTS = [
        'id',
        'transaction_date',
        'entry_type',
        'status',
        'reference_number',
        'amount',
        'created_at',
        'updated_at',
        'approved_at',
        'posted_at',
    ];

    public const ALLOWED_INCLUDES = [
        'accountCode',
        'chartOfAccount',
        'account',
        'department',
        'costCenter',
        'subCostCenter',
        'fiscalPeriod',
        'creator',
        'updater',
        'approver',
    ];
}
