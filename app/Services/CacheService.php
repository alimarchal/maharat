<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class CacheService
{
    /**
     * Cache duration constants
     */
    const USER_PERMISSIONS_TTL = 3600; // 1 hour
    const USER_ROLES_TTL = 3600; // 1 hour
    const DASHBOARD_DATA_TTL = 1800; // 30 minutes
    const API_RESPONSE_TTL = 900; // 15 minutes
    const USER_SESSION_TTL = 7200; // 2 hours
    const STATIC_DATA_TTL = 86400; // 24 hours

    /**
     * Cache user permissions
     */
    public static function cacheUserPermissions($userId, $permissions)
    {
        $key = "user_permissions_{$userId}";
        Cache::put($key, $permissions, self::USER_PERMISSIONS_TTL);
    }

    /**
     * Get cached user permissions
     */
    public static function getUserPermissions($userId)
    {
        $key = "user_permissions_{$userId}";
        return Cache::get($key);
    }

    /**
     * Cache user roles
     */
    public static function cacheUserRoles($userId, $roles)
    {
        $key = "user_roles_{$userId}";
        Cache::put($key, $roles, self::USER_ROLES_TTL);
    }

    /**
     * Get cached user roles
     */
    public static function getUserRoles($userId)
    {
        $key = "user_roles_{$userId}";
        return Cache::get($key);
    }

    /**
     * Cache dashboard data
     */
    public static function cacheDashboardData($userId, $data)
    {
        $key = "dashboard_data_{$userId}";
        Cache::put($key, $data, self::DASHBOARD_DATA_TTL);
    }

    /**
     * Get cached dashboard data
     */
    public static function getDashboardData($userId)
    {
        $key = "dashboard_data_{$userId}";
        return Cache::get($key);
    }

    /**
     * Cache API response
     */
    public static function cacheApiResponse($endpoint, $params, $response)
    {
        $key = "api_response_" . md5($endpoint . serialize($params));
        Cache::put($key, $response, self::API_RESPONSE_TTL);
    }

    /**
     * Get cached API response
     */
    public static function getApiResponse($endpoint, $params)
    {
        $key = "api_response_" . md5($endpoint . serialize($params));
        return Cache::get($key);
    }

    /**
     * Cache user session data
     */
    public static function cacheUserSession($userId, $sessionData)
    {
        $key = "user_session_{$userId}";
        Cache::put($key, $sessionData, self::USER_SESSION_TTL);
    }

    /**
     * Get cached user session data
     */
    public static function getUserSession($userId)
    {
        $key = "user_session_{$userId}";
        return Cache::get($key);
    }

    /**
     * Cache static data (departments, roles, etc.)
     */
    public static function cacheStaticData($type, $data)
    {
        $key = "static_data_{$type}";
        Cache::put($key, $data, self::STATIC_DATA_TTL);
    }

    /**
     * Get cached static data
     */
    public static function getStaticData($type)
    {
        $key = "static_data_{$type}";
        return Cache::get($key);
    }

    /**
     * Cache query results
     */
    public static function cacheQuery($query, $params, $result, $ttl = 900)
    {
        $key = "query_" . md5($query . serialize($params));
        Cache::put($key, $result, $ttl);
    }

    /**
     * Get cached query results
     */
    public static function getCachedQuery($query, $params)
    {
        $key = "query_" . md5($query . serialize($params));
        return Cache::get($key);
    }

    /**
     * Cache model data
     */
    public static function cacheModel($model, $id, $data, $ttl = 1800)
    {
        $key = "model_{$model}_{$id}";
        Cache::put($key, $data, $ttl);
    }

    /**
     * Get cached model data
     */
    public static function getCachedModel($model, $id)
    {
        $key = "model_{$model}_{$id}";
        return Cache::get($key);
    }

    /**
     * Invalidate user-related cache
     */
    public static function invalidateUserCache($userId)
    {
        $keys = [
            "user_permissions_{$userId}",
            "user_roles_{$userId}",
            "dashboard_data_{$userId}",
            "user_session_{$userId}"
        ];

        foreach ($keys as $key) {
            Cache::forget($key);
        }
    }

    /**
     * Invalidate all cache
     */
    public static function invalidateAllCache()
    {
        Cache::flush();
    }

    /**
     * Get cache statistics
     */
    public static function getCacheStats()
    {
        $driver = config('cache.default');
        
        if ($driver === 'database') {
            return [
                'driver' => 'database',
                'table' => config('cache.stores.database.table', 'cache'),
                'connection' => config('cache.stores.database.connection'),
            ];
        }
        
        if ($driver === 'file') {
            return [
                'driver' => 'file',
                'path' => config('cache.stores.file.path'),
            ];
        }

        return ['driver' => $driver];
    }

    /**
     * Cache with tags for better organization
     */
    public static function cacheWithTags($key, $data, $tags, $ttl = 3600)
    {
        Cache::tags($tags)->put($key, $data, $ttl);
    }

    /**
     * Get cached data with tags
     */
    public static function getCachedWithTags($key, $tags)
    {
        return Cache::tags($tags)->get($key);
    }

    /**
     * Invalidate cache by tags
     */
    public static function invalidateByTags($tags)
    {
        Cache::tags($tags)->flush();
    }

    /**
     * Cache paginated results
     */
    public static function cachePaginatedResults($key, $page, $perPage, $data, $ttl = 1800)
    {
        $cacheKey = "{$key}_page_{$page}_per_{$perPage}";
        Cache::put($cacheKey, $data, $ttl);
    }

    /**
     * Get cached paginated results
     */
    public static function getCachedPaginatedResults($key, $page, $perPage)
    {
        $cacheKey = "{$key}_page_{$page}_per_{$perPage}";
        return Cache::get($cacheKey);
    }

    /**
     * Cache expensive calculations
     */
    public static function cacheCalculation($calculation, $params, $result, $ttl = 3600)
    {
        $key = "calculation_" . md5($calculation . serialize($params));
        Cache::put($key, $result, $ttl);
    }

    /**
     * Get cached calculation
     */
    public static function getCachedCalculation($calculation, $params)
    {
        $key = "calculation_" . md5($calculation . serialize($params));
        return Cache::get($key);
    }

    /**
     * Remember pattern for caching
     */
    public static function remember($key, $ttl, $callback)
    {
        return Cache::remember($key, $ttl, $callback);
    }

    /**
     * Remember forever pattern
     */
    public static function rememberForever($key, $callback)
    {
        return Cache::rememberForever($key, $callback);
    }

    /**
     * Cache user activity
     */
    public static function cacheUserActivity($userId, $activity)
    {
        $key = "user_activity_{$userId}_" . date('Y-m-d');
        $activities = Cache::get($key, []);
        $activities[] = $activity;
        
        // Keep only last 100 activities per day
        if (count($activities) > 100) {
            $activities = array_slice($activities, -100);
        }
        
        Cache::put($key, $activities, 86400); // 24 hours
    }

    /**
     * Get cached user activity
     */
    public static function getUserActivity($userId, $date = null)
    {
        $date = $date ?? date('Y-m-d');
        $key = "user_activity_{$userId}_{$date}";
        return Cache::get($key, []);
    }
}
