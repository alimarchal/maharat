<?php

namespace App\QueryParameters;

class CostCenterParameters
{
    public const ALLOWED_FILTERS = [
        'parent_id',
        'department_id',
        'code',
        'name',
        'cost_center_type',
        'status',
        'manager_id',
        'budget_owner_id',
    ];

    public const ALLOWED_SORTS = [
        'id',
        'code',
        'name',
        'cost_center_type',
        'status',
        'effective_start_date',
        'effective_end_date',
        'created_at',
        'updated_at',
    ];

    public const ALLOWED_INCLUDES = [
        'parent',
        'children',
        'department',
        'manager',
        'budgetOwner',
        'createdBy',
        'updatedBy',
    ];
}
