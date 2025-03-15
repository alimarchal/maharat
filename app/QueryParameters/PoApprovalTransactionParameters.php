<?php

namespace App\QueryParameters;

class PoApprovalTransactionParameters
{
    public const ALLOWED_FILTERS = [
        'purchase_order_id',
        'requester_id',
        'assigned_to',
        'referred_to',
        'order',
        'status',
        'created_by',
        'updated_by',
    ];

    public const ALLOWED_FILTERS_EXACT = [
        'id',
        'purchase_order_id',
        'requester_id',
        'assigned_to',
        'referred_to',
        'status',
        'created_by',
        'updated_by',
    ];

    public const ALLOWED_SORTS = [
        'id',
        'purchase_order_id',
        'requester_id',
        'assigned_to',
        'referred_to',
        'order',
        'status',
        'created_at',
        'updated_at',
    ];

    public const ALLOWED_INCLUDES = [
        'purchaseOrder',
        'requester',
        'assignedTo',
        'referredTo',
        'creator',
        'updater',
    ];
}
