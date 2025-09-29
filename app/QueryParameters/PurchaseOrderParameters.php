<?php

namespace App\QueryParameters;

class PurchaseOrderParameters
{
    const ALLOWED_FILTERS = [
        'id',
        'purchase_order_no',
        'quotation_id',
        'supplier_id',
        'user_id',
        'rfq_id',
        'cost_center_id',
        'sub_cost_center_id',
        'purchase_order_date',
        'expiry_date',
        'amount',
        'vat_amount',
        'delivered_amount',
        'pending_amount',
        'status',
        'has_good_receive_note',
        'delivery_status',
        'fiscal_period_id',
        'request_budget_id',
        'created_at',
        'updated_at',
    ];

    const ALLOWED_SORTS = [
        'id',
        'purchase_order_no',
        'purchase_order_date',
        'expiry_date',
        'amount',
        'vat_amount',
        'delivered_amount',
        'pending_amount',
        'status',
        'delivery_status',
        'created_at',
        'updated_at',
    ];

    const ALLOWED_INCLUDES = [
        'quotation',
        'quotation.supplier',
        'quotation.rfq',
        'quotation.rfq.items',
        'quotation.rfq.items.product',
        'quotation.rfq.items.unit',
        'quotation.rfq.items.product.category',
        'supplier',
        'user',
        'department',
        'costCenter',
        'subCostCenter',
        'warehouse',
        'requestForQuotation',
        'requestForQuotation.items',
        'requestForQuotation.items.product',
        'requestForQuotation.items.unit',
        'requestForQuotation.items.product.category',
        'requestBudget',
        'fiscalPeriod',
        'paymentOrders',
        'goodReceiveNote',
        'goodReceiveNote.receiveGoods',
        'adjustments',
        'adjustments.user',
        'adjustments.approver',
    ];
}
