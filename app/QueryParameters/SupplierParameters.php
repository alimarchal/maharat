<?php

namespace App\QueryParameters;

class SupplierParameters
{
    public const ALLOWED_FILTERS = [
        'name',
        'code',
        'email',
        'phone',
        'is_approved',
        'currency_id',
        'status'
    ];

    public const ALLOWED_SORTS = [
        'name',
        'code',
        'created_at',
        'updated_at'
    ];

    public const ALLOWED_INCLUDES = [
        'contacts',
        'addresses',
        'currency'
    ];
}
