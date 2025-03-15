<?php

namespace App\QueryParameters;

class MahratInvoiceApprovalTransactionParameters
{
    const ALLOWED_FILTERS = [
        'invoice_id',
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
        'invoice_id',
        'requester_id',
        'assigned_to',
        'referred_to',
        'order',
        'status',
        'created_at',
        'updated_at'
    ];

    const ALLOWED_INCLUDES = [
        'invoice',
        'requester',
        'assignedUser',
        'referredUser',
        'createdByUser',
        'updatedByUser'
    ];
}
