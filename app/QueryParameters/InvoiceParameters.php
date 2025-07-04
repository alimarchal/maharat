<?php

namespace App\QueryParameters;

use Spatie\QueryBuilder\AllowedFilter;
use Illuminate\Database\Eloquent\Builder;

class InvoiceParameters
{
    public const ALLOWED_FILTERS = [
        'invoice_number',
        'representative_id',
        'representative_email',
        'client_id',
        'status',
        'payment_method',
        'issue_date',
        'due_date',
        'currency',
        'account_code_id',
    ];

    public static function getAllowedFilters()
    {
        return [
            ...self::ALLOWED_FILTERS,
            // Custom date range filters
            AllowedFilter::callback('issue_date_from', function (Builder $query, $value) {
                $query->whereDate('issue_date', '>=', $value);
            }),
            AllowedFilter::callback('issue_date_to', function (Builder $query, $value) {
                $query->whereDate('issue_date', '<=', $value);
            }),
            AllowedFilter::callback('due_date_from', function (Builder $query, $value) {
                $query->whereDate('due_date', '>=', $value);
            }),
            AllowedFilter::callback('due_date_to', function (Builder $query, $value) {
                $query->whereDate('due_date', '<=', $value);
            }),
        ];
    }

    public const ALLOWED_SORTS = [
        'id',
        'invoice_number',
        'issue_date',
        'due_date',
        'total_amount',
        'created_at',
        'updated_at'
    ];

    public const ALLOWED_INCLUDES = [
        'client',
        'representative',
        'items',
    ];
}
