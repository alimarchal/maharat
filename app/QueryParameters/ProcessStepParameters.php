<?php

namespace App\QueryParameters;

class ProcessStepParameters
{
    public const ALLOWED_FILTERS = [
        'process_id',
        'user_id',
        'name',
        'status',
        'is_active'
    ];

    public const ALLOWED_SORTS = [
        'id',
        'process_id',
        'order',
        'name',
        'created_at'
    ];

    public const ALLOWED_INCLUDES = [
        'process',
        'user',
        'creator',
        'updater'
    ];
}
