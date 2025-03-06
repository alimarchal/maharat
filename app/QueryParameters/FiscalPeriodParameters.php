<?php

namespace App\QueryParameters;

class FiscalPeriodParameters
{
    const ALLOWED_FILTERS = [
        'fiscal_year',
        'period_number',
        'period_name',
        'status',
        'created_by',
        'updated_by'
    ];

    const ALLOWED_SORTS = [
        'id',
        'fiscal_year',
        'period_number',
        'start_date',
        'end_date',
        'status',
        'created_at',
        'updated_at'
    ];

    const ALLOWED_INCLUDES = [
        'creator',
        'updater'
    ];
}
