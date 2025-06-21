<?php

namespace App\QueryFilters;

use Spatie\QueryBuilder\Filters\Filter;
use Illuminate\Database\Eloquent\Builder;

class FiscalPeriodStatusFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property): Builder
    {
        return $query->whereHas('fiscalPeriod', function ($q) use ($value) {
            $q->where('status', $value);
        });
    }
} 