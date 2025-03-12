<?php

namespace App\QueryParameters;

class MaterialRequestTransactionParameters
{
    public const ALLOWED_FILTERS = [
        'material_request_id',
        'order',
        'requester_id',
        'assigned_to',
        'referred_to',
        'status',
        'created_at',
    ];

    public const ALLOWED_SORTS = [
        'id',
        'material_request_id',
        'order',
        'requester_id',
        'assigned_to',
        'referred_to',
        'status',
        'created_at',
        'updated_at',
    ];

    public const ALLOWED_INCLUDES = [
        'materialRequest',
        'requester',
        'assignedUser',
        'referredUser',
    ];
}
