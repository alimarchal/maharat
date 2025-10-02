<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SessionHealthCheck extends Command
{
    protected $signature = 'session:health-check';
    protected $description = 'Check and repair session configuration issues';

    public function handle()
    {
        $this->info('🔍 Checking session health...');
        
        // Check session table exists
        $sessionTable = config('session.table', 'sessions');
        if (!Schema::hasTable($sessionTable)) {
            $this->error("❌ Session table '{$sessionTable}' does not exist!");
            $this->info("Run: php artisan session:table && php artisan migrate");
            return 1;
        }
        
        $this->info("✅ Session table exists");
        
        // Check session configuration
        $driver = config('session.driver');
        $this->info("📋 Session driver: {$driver}");
        
        if ($driver === 'database') {
            // Count sessions
            $sessionCount = DB::table($sessionTable)->count();
            $this->info("📊 Active sessions: {$sessionCount}");
            
            // Count expired sessions
            $expiredTime = now()->subMinutes(config('session.lifetime', 120));
            $expiredCount = DB::table($sessionTable)
                ->where('last_activity', '<', $expiredTime->timestamp)
                ->count();
            
            if ($expiredCount > 0) {
                $this->warn("⚠️  Expired sessions found: {$expiredCount}");
                
                if ($this->confirm('Clean up expired sessions?')) {
                    $deleted = DB::table($sessionTable)
                        ->where('last_activity', '<', $expiredTime->timestamp)
                        ->delete();
                    $this->info("🧹 Cleaned up {$deleted} expired sessions");
                }
            } else {
                $this->info("✅ No expired sessions found");
            }
        }
        
        // Check session configuration values
        $config = [
            'SESSION_DRIVER' => env('SESSION_DRIVER'),
            'SESSION_LIFETIME' => env('SESSION_LIFETIME'),
            'SESSION_DOMAIN' => env('SESSION_DOMAIN'),
            'SESSION_SECURE_COOKIE' => env('SESSION_SECURE_COOKIE'),
            'SESSION_SAME_SITE' => env('SESSION_SAME_SITE'),
            'APP_URL' => env('APP_URL'),
        ];
        
        $this->info("\n📋 Session Configuration:");
        foreach ($config as $key => $value) {
            $status = $value ? '✅' : '❌';
            $this->line("{$status} {$key}: " . ($value ?: 'NOT SET'));
        }
        
        // Recommendations
        $this->info("\n💡 Recommendations for ScalaHosting:");
        $this->line("• SESSION_DOMAIN should be: maharattraining.websoft.asia");
        $this->line("• SESSION_SECURE_COOKIE should be: true");
        $this->line("• SESSION_SAME_SITE should be: lax");
        $this->line("• APP_DEBUG should be: false (in production)");
        
        $this->info("\n✅ Session health check completed!");
        return 0;
    }
}

