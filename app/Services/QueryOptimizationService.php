<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class QueryOptimizationService
{
    /**
     * Optimize queries with eager loading
     */
    public static function eagerLoadRelations($query, array $relations)
    {
        return $query->with($relations);
    }

    /**
     * Optimize queries with select specific columns
     */
    public static function selectOnlyNeeded($query, array $columns)
    {
        return $query->select($columns);
    }

    /**
     * Use database indexes effectively
     */
    public static function useIndexes($query, $indexes)
    {
        if (is_array($indexes)) {
            foreach ($indexes as $index) {
                $query->where($index['column'], $index['operator'] ?? '=', $index['value']);
            }
        }
        return $query;
    }

    /**
     * Optimize pagination queries
     */
    public static function optimizePagination($query, $perPage = 15)
    {
        return $query->paginate($perPage);
    }

    /**
     * Use chunking for large datasets
     */
    public static function chunkLargeQueries($query, $chunkSize = 1000)
    {
        return $query->chunk($chunkSize);
    }

    /**
     * Optimize count queries
     */
    public static function optimizeCount($query)
    {
        return $query->count();
    }

    /**
     * Use exists instead of count when checking existence
     */
    public static function useExists($query)
    {
        return $query->exists();
    }

    /**
     * Optimize with database views
     */
    public static function useView($viewName)
    {
        return DB::table($viewName);
    }

    /**
     * Use raw queries for complex operations
     */
    public static function useRawQuery($sql, $bindings = [])
    {
        return DB::select($sql, $bindings);
    }

    /**
     * Optimize joins
     */
    public static function optimizeJoins($query, $joins)
    {
        foreach ($joins as $join) {
            $query->join($join['table'], $join['first'], $join['operator'], $join['second']);
        }
        return $query;
    }

    /**
     * Use subqueries for complex filtering
     */
    public static function useSubquery($query, $subquery)
    {
        return $query->whereIn('id', $subquery);
    }
}
