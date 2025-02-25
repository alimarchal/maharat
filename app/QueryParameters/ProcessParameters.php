<?php

namespace App\QueryParameters;

class ProcessParameters
{
    public const ALLOWED_FILTERS = [
        'title',
        'is_active',
        'status',
        'created_by'
    ];

    public const ALLOWED_SORTS = [
        'id',
        'title',
        'created_at',
        'updated_at'
    ];

    public const ALLOWED_INCLUDES = [
        'steps',
        'steps.user',
        'creator',
        'updater'
    ];
}
