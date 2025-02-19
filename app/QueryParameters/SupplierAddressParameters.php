<?php

namespace App\QueryParameters;

class SupplierAddressParameters
{
    /**
     * Defines the allowed filter parameters for supplier addresses.
     * These filters can be used in API queries to filter the results.
     */
    public const ALLOWED_FILTERS = [
        'supplier_id',
        'address_type',
        'city',
        'state',
        'country',
        'postal_code'
    ];

    /**
     * Defines the allowed sort parameters for supplier addresses.
     * These can be used to sort the results in ascending or descending order.
     */
    public const ALLOWED_SORTS = [
        'address_type',
        'city',
        'state',
        'country',
        'postal_code',
        'created_at',
        'updated_at'
    ];

    /**
     * Defines the allowed relationship includes for supplier addresses.
     * These can be used to include related data in the API response.
     */
    public const ALLOWED_INCLUDES = [
        'supplier'
    ];
}
