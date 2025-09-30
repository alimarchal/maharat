<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Queue;

class PerformanceMonitoringService
{
    /**
     * Monitor database performance
     */
    public static function monitorDatabasePerformance()
    {
        try {
            $stats = [
                'slow_queries' => DB::select("SHOW STATUS LIKE 'Slow_queries'")[0]->Value ?? 0,
                'connections' => DB::select("SHOW STATUS LIKE 'Connections'")[0]->Value ?? 0,
                'max_used_connections' => DB::select("SHOW STATUS LIKE 'Max_used_connections'")[0]->Value ?? 0,
                'threads_connected' => DB::select("SHOW STATUS LIKE 'Threads_connected'")[0]->Value ?? 0,
                'threads_running' => DB::select("SHOW STATUS LIKE 'Threads_running'")[0]->Value ?? 0,
                'queries_per_second' => DB::select("SHOW STATUS LIKE 'Queries'")[0]->Value ?? 0,
            ];

            return $stats;
        } catch (\Exception $e) {
            Log::error('Failed to monitor database performance', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Monitor cache performance
     */
    public static function monitorCachePerformance()
    {
        try {
            $driver = config('cache.default');
            
            if ($driver === 'database') {
                $cacheTable = config('cache.stores.database.table', 'cache');
                $cacheCount = DB::table($cacheTable)->count();
                
                return [
                    'driver' => 'database',
                    'cache_entries' => $cacheCount,
                    'table' => $cacheTable,
                ];
            }
            
            if ($driver === 'file') {
                $cachePath = config('cache.stores.file.path');
                $fileCount = 0;
                if (is_dir($cachePath)) {
                    $files = glob($cachePath . '/*');
                    $fileCount = count($files);
                }
                
                return [
                    'driver' => 'file',
                    'cache_files' => $fileCount,
                    'path' => $cachePath,
                ];
            }

            return ['driver' => $driver];
        } catch (\Exception $e) {
            Log::error('Failed to monitor cache performance', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Monitor queue performance
     */
    public static function monitorQueuePerformance()
    {
        try {
            $queues = ['default', 'emails', 'files', 'high', 'low'];
            $stats = [];

            foreach ($queues as $queue) {
                $stats[$queue] = [
                    'size' => Queue::size($queue),
                    'failed' => Queue::size($queue . '_failed'),
                ];
            }

            return $stats;
        } catch (\Exception $e) {
            Log::error('Failed to monitor queue performance', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Monitor application performance
     */
    public static function monitorApplicationPerformance()
    {
        try {
            $stats = [
                'memory_usage' => memory_get_usage(true),
                'memory_peak' => memory_get_peak_usage(true),
                'execution_time' => microtime(true) - LARAVEL_START,
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'environment' => app()->environment(),
            ];

            return $stats;
        } catch (\Exception $e) {
            Log::error('Failed to monitor application performance', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Get comprehensive performance report
     */
    public static function getPerformanceReport()
    {
        try {
            return [
                'database' => self::monitorDatabasePerformance(),
                'cache' => self::monitorCachePerformance(),
                'queue' => self::monitorQueuePerformance(),
                'application' => self::monitorApplicationPerformance(),
                'timestamp' => now()->toISOString(),
            ];
        } catch (\Exception $e) {
            Log::error('Failed to generate performance report', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Calculate cache hit rate
     */
    private static function calculateHitRate($hits, $misses)
    {
        $total = $hits + $misses;
        return $total > 0 ? round(($hits / $total) * 100, 2) : 0;
    }

    /**
     * Log performance metrics
     */
    public static function logPerformanceMetrics()
    {
        try {
            $report = self::getPerformanceReport();
            Log::info('Performance metrics', $report);
        } catch (\Exception $e) {
            Log::error('Failed to log performance metrics', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Check performance thresholds
     */
    public static function checkPerformanceThresholds()
    {
        try {
            $report = self::getPerformanceReport();
            $alerts = [];

            // Check memory usage
            if ($report['application']['memory_usage'] > 128 * 1024 * 1024) { // 128MB
                $alerts[] = 'High memory usage detected';
            }

            // Check execution time
            if ($report['application']['execution_time'] > 5) { // 5 seconds
                $alerts[] = 'Slow execution time detected';
            }

            // Check database connections
            if ($report['database']['threads_connected'] > 100) {
                $alerts[] = 'High database connection count';
            }

            // Check queue sizes
            foreach ($report['queue'] as $queue => $stats) {
                if ($stats['size'] > 1000) {
                    $alerts[] = "Large queue size detected: {$queue}";
                }
            }

            if (!empty($alerts)) {
                Log::warning('Performance alerts triggered', ['alerts' => $alerts]);
            }

            return $alerts;
        } catch (\Exception $e) {
            Log::error('Failed to check performance thresholds', ['error' => $e->getMessage()]);
            return [];
        }
    }
}
