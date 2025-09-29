<?php

namespace App\QueryParameters;

class GrnParameters
{
    const ALLOWED_FILTERS = [
        'id',
        'user_id',
        'grn_number',
        'quotation_id',
        'purchase_order_id',
        'quantity',
        'delivery_date',
        'delivery_status',
        'created_at',
        'updated_at',
    ];

    const ALLOWED_SORTS = [
        'id',
        'grn_number',
        'quantity',
        'delivery_date',
        'delivery_status',
        'created_at',
        'updated_at',
    ];

    const ALLOWED_INCLUDES = [
        'user',
        'quotation',
        'quotation.supplier',
        'quotation.rfq',
        'purchaseOrder',
        'purchaseOrder.supplier',
        'receiveGoods',
        'receiveGoods.supplier',
        'receiveGoods.category',
        'externalDeliveryNote',
        'adjustments',
        'adjustments.user',
        'adjustments.approver',
    ];
}
