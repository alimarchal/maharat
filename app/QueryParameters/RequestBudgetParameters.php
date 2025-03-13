<?php

namespace App\QueryParameters;

class RequestBudgetParameters
{
    public const ALLOWED_FILTERS = [
        'fiscal_period_id',
        'department_id',
        'cost_center_id',
        'sub_cost_center',
        'urgency',
        'status',
        'created_by',
    ];

    public const ALLOWED_SORTS = [
        'id',
        'fiscal_period_id',
        'department_id',
        'cost_center_id',
        'requested_amount',
        'approved_amount',
        'urgency',
        'status',
        'created_at',
        'updated_at',
    ];

    public const ALLOWED_INCLUDES = [
        'fiscalPeriod',
        'department',
        'costCenter',
        'subCostCenter',
        'creator',
        'updater',
    ];
}
