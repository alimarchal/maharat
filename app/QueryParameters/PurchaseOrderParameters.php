<?php

namespace App\QueryParameters;

class PurchaseOrderParameters
{
    public const ALLOWED_FILTERS = [
        'purchase_order_no',
        'warehouse_id',
        'rfq_id',
        'department_id',
        'cost_center_id',
        'sub_cost_center_id',
        'quotation_id',
        'supplier_id',
        'user_id',
        'purchase_order_date',
        'status',
        'created_at'
    ];

    public const ALLOWED_SORTS = [
        'purchase_order_no',
        'rfq_id',
        'purchase_order_date',
        'amount',
        'status',
        'created_at'
    ];

    public const ALLOWED_INCLUDES = [
        'quotation',
        'supplier',
        'user',
        'department',
        'costCenter',
        'subCostCenter',
        'warehouse',
        'rfq',
    ];
}
