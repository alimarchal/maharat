<?php

namespace App\QueryParameters;

class TaskDescriptionParameters
{
    const ALLOWED_FILTERS = [
        'task_id',
        'action',
        'user_id',
        'created_at',
    ];

    const ALLOWED_SORTS = [
        'id',
        'task_id',
        'action',
        'user_id',
        'created_at',
        'updated_at',
    ];

    const ALLOWED_INCLUDES = [
        'task',
        'user',
    ];
}
