<?php

namespace App\QueryParameters;

class IssueMaterialParameters
{
    public const ALLOWED_FILTERS = [
        'material_request_id',
        'cost_center_id',
        'sub_cost_center_id',
        'department_id',
        'priority',
        'status',
        'created_by',
        'updated_by',
    ];

    public const ALLOWED_SORTS = [
        'id',
        'material_request_id',
        'cost_center_id',
        'sub_cost_center_id',
        'department_id',
        'priority',
        'status',
        'created_at',
        'updated_at',
    ];

    public const ALLOWED_INCLUDES = [
        'materialRequest',
        'costCenter',
        'subCostCenter',
        'department',
        'creator',
        'updater',
    ];
}
