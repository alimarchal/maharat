<?php

namespace App\QueryParameters;

class GrnReceiveGoodParameters
{
    const ALLOWED_FILTERS = [
        'user_id',
        'supplier_id',
        'purchase_order_id',
        'quotation_id',
        'category_id',
        'upc',
        'delivery_date',
        'due_delivery_date',
    ];

    const ALLOWED_SORTS = [
        'id',
        'supplier_id',
        'quantity_quoted',
        'quantity_delivered',
        'due_delivery_date',
        'delivery_date',
        'created_at',
        'updated_at',
    ];

    const ALLOWED_INCLUDES = [
        'user',
        'supplier',
        'purchaseOrder',
        'quotation',
        'category',
    ];
}
