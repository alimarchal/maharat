<?php

namespace App\QueryParameters;

class GrnParameters
{
    const ALLOWED_FILTERS = [
        'user_id',
        'grn_number',
        'quotation_id',
        'purchase_order_id',
        'delivery_date',
    ];

    const ALLOWED_SORTS = [
        'id',
        'grn_number',
        'quantity',
        'delivery_date',
        'created_at',
        'updated_at',
    ];

    const ALLOWED_INCLUDES = [
        'user',
        'quotation',
        'purchaseOrder',
        'receiveGoods',
    ];
}
