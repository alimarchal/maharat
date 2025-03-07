<?php

namespace App\QueryParameters;

class PaymentOrderLogParameters
{
    public const ALLOWED_FILTERS = [
        'payment_order_id',
        'action',
        'priority'
    ];

    public const ALLOWED_SORTS = [
        'id',
        'created_at',
        'updated_at'
    ];

    public const ALLOWED_INCLUDES = [
        'paymentOrder'
    ];
}
