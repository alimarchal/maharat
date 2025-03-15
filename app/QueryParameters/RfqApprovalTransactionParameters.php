<?php

namespace App\QueryParameters;

class RfqApprovalTransactionParameters
{
    public const ALLOWED_FILTERS = [
        'rfq_id',
        'requester_id',
        'assigned_to',
        'referred_to',
        'order',
        'status',
        'created_by',
        'updated_by',
    ];

    public const ALLOWED_SORTS = [
        'id',
        'rfq_id',
        'requester_id',
        'assigned_to',
        'referred_to',
        'order',
        'status',
        'created_at',
        'updated_at',
    ];

    public const ALLOWED_INCLUDES = [
        'rfq',
        'requester',
        'assignedTo',
        'referredTo',
        'creator',
        'updater',
    ];
}
