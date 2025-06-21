<?php

namespace App\QueryParameters;

class BudgetParameters
{
    /**
     * Allowed filters for the Budget model.
     *
     * @var array
     */
    public const ALLOWED_FILTERS = [
        'fiscal_period_id',
        'department_id',
        'cost_center_id',
        'sub_cost_center_id',
        'status',
        'description',
        'created_by',
    ];

    /**
     * Allowed sorts for the Budget model.
     *
     * @var array
     */
    public const ALLOWED_SORTS = [
        'id',
        'fiscal_period_id',
        'department_id',
        'cost_center_id',
        'total_revenue_planned',
        'total_revenue_actual',
        'total_expense_planned',
        'total_expense_actual',
        'status',
        'created_at',
        'updated_at',
    ];

    /**
     * Allowed includes for the Budget model.
     *
     * @var array
     */
    public const ALLOWED_INCLUDES = [
        'fiscalPeriod',
        'department',
        'costCenter',
        'creator',
        'updater',
        'subCostCenter',
        'requestBudget',
        'budgetApprovalTransactions',
    ];
}
