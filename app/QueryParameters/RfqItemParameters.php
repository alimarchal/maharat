<?php

namespace App\QueryParameters;

class RfqItemParameters
{
    public const ALLOWED_FILTERS = [
        'rfq_id',
        'category_id',
        'item_name',
        'unit_id',
        'brand',
        'model',
        'expected_delivery_date',
        'status_id',
    ];

    public const ALLOWED_SORTS = [
        'item_name',
        'quantity',
        'expected_delivery_date',
        'quoted_price',
        'negotiated_price',
        'created_at',
        'updated_at',
    ];

    public const ALLOWED_INCLUDES = [
        'rfq',
        'category',
        'unit',
        'status',
    ];
}
