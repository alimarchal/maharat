<?php

namespace App\QueryParameters;

class ExternalDeliveryNoteParameters
{
    public const ALLOWED_FILTERS = [
        'delivery_note_number',
        'created_at',
    ];

    public const ALLOWED_FILTERS_EXACT = [
        'id',
        'user_id',
        'grn_id',
        'purchase_order_id',
    ];

    public const ALLOWED_SORTS = [
        'id',
        'user_id',
        'grn_id',
        'purchase_order_id',
        'delivery_note_number',
        'created_at',
        'updated_at',
    ];

    public const ALLOWED_INCLUDES = [
        'user',
        'grn',
        'purchaseOrder',
    ];
}
