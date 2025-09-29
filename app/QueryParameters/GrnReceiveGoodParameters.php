<?php

namespace App\QueryParameters;

class GrnReceiveGoodParameters
{
    const ALLOWED_FILTERS = [
        'id',
        'user_id',
        'grn_id',
        'supplier_id',
        'purchase_order_id',
        'quotation_id',
        'quantity_quoted',
        'quantity_delivered',
        'quantity_pending',
        'due_delivery_date',
        'receiver_name',
        'upc',
        'category_id',
        'delivery_date',
        'delivery_status',
        'created_at',
        'updated_at',
    ];

    const ALLOWED_SORTS = [
        'id',
        'quantity_quoted',
        'quantity_delivered',
        'quantity_pending',
        'due_delivery_date',
        'delivery_date',
        'delivery_status',
        'created_at',
        'updated_at',
    ];

    const ALLOWED_INCLUDES = [
        'grn',
        'user',
        'supplier',
        'purchaseOrder',
        'purchaseOrder.supplier',
        'quotation',
        'quotation.supplier',
        'category',
    ];
}
