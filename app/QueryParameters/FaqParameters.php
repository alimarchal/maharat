<?php

namespace App\QueryParameters;

class FaqParameters
{
    /**
     * The allowed filters for the FAQ model.
     *
     * @var array
     */
    public const ALLOWED_FILTERS = [
        'title',
        'question',
        'description',
        'created_at',
    ];

    /**
     * The allowed sorts for the FAQ model.
     *
     * @var array
     */
    public const ALLOWED_SORTS = [
        'id',
        'title',
        'created_at',
        'updated_at',
        'order'
    ];

    /**
     * The allowed includes for the FAQ model.
     *
     * @var array
     */
    public const ALLOWED_INCLUDES = [];
}
