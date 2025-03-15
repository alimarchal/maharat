<?php

namespace App\QueryParameters;

class PaymentOrderApprovalTransactionParameters
{
    const ALLOWED_FILTERS = [
        'payment_order_id',
        'requester_id',
        'assigned_to',
        'referred_to',
        'order',
        'status',
        'created_by',
        'updated_by'
    ];

    const ALLOWED_SORTS = [
        'id',
        'payment_order_id',
        'requester_id',
        'assigned_to',
        'referred_to',
        'order',
        'status',
        'created_at',
        'updated_at'
    ];

    const ALLOWED_INCLUDES = [
        'paymentOrder',
        'requester',
        'assignedUser',
        'referredUser',
        'createdByUser',
        'updatedByUser'
    ];
}
