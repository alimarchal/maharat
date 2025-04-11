<?php

namespace App\QueryParameters;

class BudgetUsageParameters
{
    public const ALLOWED_FILTERS = [
        'sub_cost_center',
        'fiscal_period_id',
        'created_by',
        'updated_by',
    ];

    public const ALLOWED_SORTS = [
        'id',
        'sub_cost_center',
        'fiscal_period_id',
        'sub_cost_center_approved_amount',
        'sub_cost_center_reserved_amount',
        'sub_cost_center_consumed_amount',
        'created_at',
        'updated_at',
    ];

    public const ALLOWED_INCLUDES = [
        'costCenter',
        'fiscalPeriod',
        'creator',
        'updater',
    ];
}
