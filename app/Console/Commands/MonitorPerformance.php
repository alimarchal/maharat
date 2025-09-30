<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\PerformanceMonitoringService;
use App\Services\CacheService;
use App\Services\QueueService;

class MonitorPerformance extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'performance:monitor {--json : Output in JSON format}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Monitor application performance metrics';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Laravel Performance Monitor');
        $this->newLine();

        $report = PerformanceMonitoringService::getPerformanceReport();
        $alerts = PerformanceMonitoringService::checkPerformanceThresholds();

        if ($this->option('json')) {
            $this->line(json_encode([
                'report' => $report,
                'alerts' => $alerts,
                'timestamp' => now()->toISOString()
            ], JSON_PRETTY_PRINT));
            return;
        }

        $this->displayPerformanceReport($report);
        $this->displayAlerts($alerts);
    }

    /**
     * Display performance report
     */
    private function displayPerformanceReport($report)
    {
        $this->info('📊 Performance Report');
        $this->newLine();

        // Database Performance
        if (isset($report['database'])) {
            $this->info('🗄️  Database Performance:');
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Slow Queries', $report['database']['slow_queries'] ?? 'N/A'],
                    ['Connections', $report['database']['connections'] ?? 'N/A'],
                    ['Max Used Connections', $report['database']['max_used_connections'] ?? 'N/A'],
                    ['Threads Connected', $report['database']['threads_connected'] ?? 'N/A'],
                    ['Threads Running', $report['database']['threads_running'] ?? 'N/A'],
                    ['Queries Per Second', $report['database']['queries_per_second'] ?? 'N/A'],
                ]
            );
            $this->newLine();
        }

        // Cache Performance
        if (isset($report['cache'])) {
            $this->info('💾 Cache Performance:');
            $cacheData = [];
            foreach ($report['cache'] as $key => $value) {
                $cacheData[] = [$key, $value];
            }
            $this->table(['Metric', 'Value'], $cacheData);
            $this->newLine();
        }

        // Queue Performance
        if (isset($report['queue'])) {
            $this->info('📋 Queue Performance:');
            $queueData = [];
            foreach ($report['queue'] as $queue => $stats) {
                $queueData[] = [$queue, $stats['size'], $stats['failed']];
            }
            $this->table(['Queue', 'Size', 'Failed'], $queueData);
            $this->newLine();
        }

        // Application Performance
        if (isset($report['application'])) {
            $this->info('🚀 Application Performance:');
            $this->table(
                ['Metric', 'Value'],
                [
                    ['Memory Usage', $this->formatBytes($report['application']['memory_usage'] ?? 0)],
                    ['Memory Peak', $this->formatBytes($report['application']['memory_peak'] ?? 0)],
                    ['Execution Time', round($report['application']['execution_time'] ?? 0, 3) . 's'],
                    ['PHP Version', $report['application']['php_version'] ?? 'N/A'],
                    ['Laravel Version', $report['application']['laravel_version'] ?? 'N/A'],
                    ['Environment', $report['application']['environment'] ?? 'N/A'],
                ]
            );
            $this->newLine();
        }
    }

    /**
     * Display alerts
     */
    private function displayAlerts($alerts)
    {
        if (empty($alerts)) {
            $this->info('✅ No performance alerts');
            return;
        }

        $this->warn('⚠️  Performance Alerts:');
        foreach ($alerts as $alert) {
            $this->error("  • {$alert}");
        }
        $this->newLine();
    }

    /**
     * Format bytes to human readable format
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }
}
