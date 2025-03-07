<?php

namespace App\QueryParameters;

class CustomerParameters
{
    public const ALLOWED_FILTERS = [
        'name',
        'commercial_registration_number',
        'tax_number',
        'type',
        'is_limited',
        'is_tax_exempt',
        'city',
        'country_code'
    ];

    public const ALLOWED_SORTS = [
        'id',
        'name',
        'type',
        'created_at',
        'updated_at'
    ];

    public const ALLOWED_INCLUDES = [
        'sentInvoices',
        'receivedInvoices'
    ];
}
