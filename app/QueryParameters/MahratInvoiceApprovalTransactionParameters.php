<?php

namespace App\QueryParameters;

use Spatie\QueryBuilder\AllowedFilter;

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

    public static function getAllowedFilters()
    {
        return array_merge(
            self::ALLOWED_FILTERS,
            [
                AllowedFilter::callback('invoice.status', function ($query, $value) {
                    $query->whereHas('invoice', function ($query) use ($value) {
                        $query->where('status', $value);
                    });
                }),
            ]
        );
    }

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
