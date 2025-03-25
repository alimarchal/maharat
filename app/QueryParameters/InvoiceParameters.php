<?php

namespace App\QueryParameters;

class InvoiceParameters
{
    public const ALLOWED_FILTERS = [
        'invoice_number',
        'representative',
        'representative_email',
        'client_id',
        'status',
        'payment_method',
        'issue_date',
        'due_date',
        'currency'
    ];

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
        'items'
    ];
}
