<?php

namespace App\QueryParameters;

use Spatie\QueryBuilder\AllowedFilter;

class GrnApprovalTransactionParameters
{
    const ALLOWED_FILTERS = [
        'grn_id',
        'requester_id',
        'assigned_to',
        'status',
        'order',
        'id'
    ];

    const ALLOWED_SORTS = [
        'id',
        'created_at',
        'updated_at',
        'order',
    ];

    const ALLOWED_INCLUDES = [
        'grn',
        'requester',
        'assignedTo',
        'referredTo',
        'creator',
        'updater',
    ];
}
