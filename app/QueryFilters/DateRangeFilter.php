<?php

namespace App\QueryFilters;

use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\Filters\Filter;

class DateRangeFilter implements Filter
{
    public function __invoke(Builder $query, $value, string $property)
    {
        // Handle case when $value is already an array
        if (is_array($value)) {
            if (count($value) === 2) {
                return $query->whereBetween('transaction_date', [$value[0], $value[1]]);
            }
            return $query;
        }

        // Handle case when $value is a string that needs to be exploded
        if (is_string($value)) {
            $dates = explode(',', $value);

            if (count($dates) === 2) {
                $startDate = $dates[0];
                $endDate = $dates[1];

                return $query->whereBetween('transaction_date', [$startDate, $endDate]);
            }
        }

        return $query;
    }
}
