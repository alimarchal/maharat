<?php

namespace App\QueryParameters;
use Spatie\QueryBuilder\AllowedFilter;


class TaskParameters
{
    const ALLOWED_FILTERS = [
        'process_step_id',
        'process_id',
        'urgency',
        'assigned_at',
        'deadline',
        'read_status',
        'created_at',
        'status',
    ];

    public static function getAllFilters()
    {
        return [
            // Regular partial match filters
            ...self::ALLOWED_FILTERS,

            // Exact match filters
            AllowedFilter::exact('process_step_id'),
            AllowedFilter::exact('process_id'),
            AllowedFilter::exact('assigned_from_user_id'),
            AllowedFilter::exact('assigned_to_user_id'),
        ];
    }



    const ALLOWED_SORTS = [
        'id',
        'process_step_id',
        'process_id',
        'assigned_at',
        'deadline',
        'urgency',
        'assigned_from_user_id',
        'assigned_to_user_id',
        'read_status',
        'created_at',
        'updated_at',
        'status',
    ];

    const ALLOWED_INCLUDES = [
        'processStep',
        'process',
        'assignedUser',
        'descriptions',
    ];
}
