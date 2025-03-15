<?php

namespace App\QueryParameters;

class BudgetRequestApprovalTransactionParameters
{
    const ALLOWED_FILTERS = [
        'request_budgets_id',
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
        'request_budgets_id',
        'requester_id',
        'assigned_to',
        'referred_to',
        'order',
        'status',
        'created_at',
        'updated_at'
    ];

    const ALLOWED_INCLUDES = [
        'requestBudget',
        'requester',
        'assignedUser',
        'referredUser',
        'createdByUser',
        'updatedByUser'
    ];
}
