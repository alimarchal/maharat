<?php

namespace App\QueryParameters;

class TaskParameters
{
    const ALLOWED_FILTERS = [
        'process_step_id',
        'process_id',
        'assigned_from_user_id',
        'assigned_to_user_id',
        'urgency',
        'assigned_at',
        'deadline',
        'read_status',
        'created_at',
        'status',
    ];

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
