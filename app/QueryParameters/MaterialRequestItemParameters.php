<?php

namespace App\QueryParameters;

class MaterialRequestItemParameters
{
    public const ALLOWED_FILTERS = [
        'material_request_id',
        'product_id',
        'unit_id',
        'category_id',
        'quantity',
        'urgency',
        'created_at',
    ];

    public const ALLOWED_SORTS = [
        'quantity',
        'created_at',
    ];

    public const ALLOWED_INCLUDES = [
        'materialRequest',
        'product',
        'unit',
        'category',
        'urgencyStatus',
    ];
}
