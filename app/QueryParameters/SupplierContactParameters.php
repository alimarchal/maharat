<?php

namespace App\QueryParameters;

class SupplierContactParameters
{
    /**
     * Defines the allowed filter parameters for supplier contacts.
     * These filters can be used in API queries to filter the results.
     */
    public const ALLOWED_FILTERS = [
        'supplier_id',
        'contact_name',
        'designation',
        'email',
        'phone',
        'is_primary'
    ];

    /**
     * Defines the allowed sort parameters for supplier contacts.
     * These can be used to sort the results in ascending or descending order.
     */
    public const ALLOWED_SORTS = [
        'contact_name',
        'designation',
        'created_at',
        'updated_at'
    ];

    /**
     * Defines the allowed relationship includes for supplier contacts.
     * These can be used to include related data in the API response.
     */
    public const ALLOWED_INCLUDES = [
        'supplier'
    ];
}
