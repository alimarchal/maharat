<?php

namespace App\QueryParameters;

class InventoryTransferParameters
{
    public const ALLOWED_FILTERS = [
        'from_warehouse_id',
        'to_warehouse_id',
        'product_id',
        'quantity',
        'reason',
        'tracking_number',
        'transfer_date',
        'created_at',
    ];

    public const ALLOWED_SORTS = [
        'tracking_number',
        'quantity',
        'transfer_date',
        'created_at',
    ];

    public const ALLOWED_INCLUDES = [
        'fromWarehouse',
        'toWarehouse',
        'product',
        'reasonStatus',
    ];
}
