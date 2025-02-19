<?php

namespace App\QueryParameters;

class QuotationDocumentParameters
{
    public const ALLOWED_FILTERS = [
        'quotation_id',
        'type',
        'original_name'
    ];

    public const ALLOWED_SORTS = [
        'original_name',
        'type',
        'created_at',
        'updated_at'
    ];

    public const ALLOWED_INCLUDES = [
        'quotation'
    ];
}
