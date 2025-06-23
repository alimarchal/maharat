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
        'request_budget_id',
        'status',
        'created_at'
    ];

    public const ALLOWED_SORTS = [
        'cost_center_id',
        'sub_cost_center_id',
        'purchase_order_no',
        'rfq_id',
        'purchase_order_date',
        'amount',
        'status',
        'created_at'
    ];

    public const ALLOWED_INCLUDES = [
        'quotation',
        'quotation.rfq',
        'quotation.rfq.items',
        'quotation.rfq.items.product',
        'quotation.rfq.items.unit',
        'quotation.rfq.items.brand',
        'supplier',
        'user',
        'department',
        'paymentOrders',
        'goodReceiveNote',
        'costCenter',
        'subCostCenter',
        'warehouse',
        'requestBudget',
        'rfq',
        'rfq.warehouse',
        'rfq.items',
        'rfq.items.product',
        'rfq.items.product.category',
        'rfq.items.product.unit',
        'rfq.items.unit',
        'rfq.items.brand',
        'requestForQuotation.warehouse',
        'requestForQuotation.items.product.category',
        'requestForQuotation.items.product.unit',
    ];
}
