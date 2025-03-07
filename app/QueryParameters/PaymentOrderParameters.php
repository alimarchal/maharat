<?php

namespace App\QueryParameters;

class PaymentOrderParameters
{
    public const ALLOWED_FILTERS = [
        'payment_order_number',
        'user_id',
        'purchase_order_id',
        'date'
    ];

    public const ALLOWED_SORTS = [
        'id',
        'payment_order_number',
        'date',
        'created_at',
        'updated_at'
    ];

    public const ALLOWED_INCLUDES = [
        'user',
        'purchaseOrder',
        'purchaseOrder.supplier',
        'purchaseOrder.quotation',
        'logs'
    ];
}
