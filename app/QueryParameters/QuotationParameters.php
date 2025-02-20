<?php

namespace App\QueryParameters;

class QuotationParameters
{
    public const ALLOWED_FILTERS = [
        'rfq_id',
        'supplier_id',
        'quotation_number',
        'issue_date',
        'valid_until',
        'status_id'
    ];

    public const ALLOWED_SORTS = [
        'quotation_number',
        'issue_date',
        'valid_until',
        'total_amount',
        'created_at',
        'updated_at'
    ];

    public const ALLOWED_INCLUDES = [
        'rfq',
        'supplier',
        'status',
        'documents'
    ];
}
