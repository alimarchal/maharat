<?php

namespace App\QueryParameters;

class BudgetApprovalTransactionParameters
{
    const ALLOWED_FILTERS = [
        'budget_id',
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
        'budget_id',
        'requester_id',
        'assigned_to',
        'referred_to',
        'order',
        'status',
        'created_at',
        'updated_at'
    ];

    const ALLOWED_INCLUDES = [
        'budget',
        'requester',
        'assignedUser',
        'referredUser',
        'createdByUser',
        'updatedByUser'
    ];
}
