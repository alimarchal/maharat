<?php

namespace App\QueryParameters;

class FiscalPeriodParameters
{
    const ALLOWED_FILTERS = [
        'fiscal_year_id',
        'period_name',
        'status',
        'created_by',
        'updated_by'
    ];

    const ALLOWED_SORTS = [
        'id',
        'fiscal_year_id',
        'start_date',
        'end_date',
        'status',
        'created_at',
        'updated_at'
    ];

    const ALLOWED_INCLUDES = [
        'fiscalYear',
        'creator',
        'updater'
    ];
}
