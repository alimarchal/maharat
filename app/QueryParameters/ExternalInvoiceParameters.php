<?php

namespace App\QueryParameters;

class ExternalInvoiceParameters
{
    public const ALLOWED_FILTERS = [
        'status',
        'type',
        'supplier_id',
        'purchase_order_id',
        'user_id',
        'invoice_id',
        'payable_date',
    ];

    public const ALLOWED_SORTS = [
        'id',
        'invoice_id',
        'amount',
        'vat_amount',
        'status',
        'type',
        'payable_date',
        'created_at',
        'updated_at',
    ];

    public const ALLOWED_INCLUDES = [
        'user',
        'supplier',
        'purchaseOrder',
        'documents',
    ];
}
