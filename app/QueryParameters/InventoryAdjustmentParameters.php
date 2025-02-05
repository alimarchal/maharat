<?php

namespace App\QueryParameters;

class InventoryAdjustmentParameters
{
    public const ALLOWED_FILTERS = [
        'warehouse_id',
        'product_id',
        'purchase_order_number',
        'quantity',
        'reason',
        'approved_by',
        'created_at',
    ];

    public const ALLOWED_SORTS = [
        'purchase_order_number',
        'quantity',
        'created_at',
    ];

    public const ALLOWED_INCLUDES = [
        'warehouse',
        'product',
        'reasonStatus',
        'approvedBy',
    ];
}
