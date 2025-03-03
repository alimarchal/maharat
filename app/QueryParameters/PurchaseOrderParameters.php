<?php

namespace App\QueryParameters;

class PurchaseOrderParameters
{
    public const ALLOWED_FILTERS = [
        'purchase_order_no',
        'quotation_id',
        'supplier_id',
        'user_id',
        'purchase_order_date',
        'status',
        'created_at'
    ];

    public const ALLOWED_SORTS = [
        'purchase_order_no',
        'purchase_order_date',
        'amount',
        'status',
        'created_at'
    ];

    public const ALLOWED_INCLUDES = [
        'quotation',
        'supplier',
        'user'
    ];
}
