<?php

namespace App\QueryParameters;

class MaterialRequestParameters
{
    public const ALLOWED_FILTERS = [
        'requester_id',
        'warehouse_id',
        'department_id',
        'cost_center_id',
        'sub_cost_center_id',
        'expected_delivery_date',
        'status_id',
        'created_at',
    ];

    public const ALLOWED_SORTS = [
        'expected_delivery_date',
        'created_at',
    ];

    public const ALLOWED_INCLUDES = [
        'requester',
        'warehouse',
        'department',
        'costCenter',
        'subCostCenter',
        'status',
        'items',
        'items.product',
        'items.unit',
        'items.category',
        'items.urgencyStatus',
    ];
}
