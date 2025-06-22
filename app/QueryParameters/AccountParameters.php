<?php

namespace App\QueryParameters;

class AccountParameters
{
    public const ALLOWED_FILTERS = [
        'name',
        'description',
        'cost_center_id',
        'department_id',
        'status',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at'
    ];

    public const ALLOWED_SORTS = [
        'id',
        'name',
        'description',
        'cost_center_id',
        'department_id',
        'status',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at'
    ];

    public const ALLOWED_INCLUDES = [
        'costCenter',
        'costCenterCount',
        'costCenterExists',
        'creator',
        'creatorCount',
        'creatorExists',
        'updater',
        'updaterCount',
        'updaterExists',
        'chartOfAccount',
        'chartOfAccountCount',
        'chartOfAccountExists',
        'chartOfAccount.accountCode',
        'accountCode',
    ];

    /**
     * Get all the allowed filters.
     *
     * @return array
     */
    public static function getAllowedFilters()
    {
        return self::ALLOWED_FILTERS;
    }
}
