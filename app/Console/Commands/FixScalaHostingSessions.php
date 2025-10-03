<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixScalaHostingSessions extends Command
{
    protected $signature = 'scalahosting:fix-sessions';
    protected $description = 'Fix ScalaHosting session issues by cleaning up orphaned sessions';

    public function handle()
    {
        $this->info('Fixing ScalaHosting session issues...');
        
        // Clean up orphaned sessions (sessions without users)
        $orphanedSessions = DB::table('sessions')
            ->whereNull('user_id')
            ->where('last_activity', '<', now()->subHours(2)->timestamp)
            ->count();
            
        if ($orphanedSessions > 0) {
            DB::table('sessions')
                ->whereNull('user_id')
                ->where('last_activity', '<', now()->subHours(2)->timestamp)
                ->delete();
                
            $this->info("Cleaned up {$orphanedSessions} orphaned sessions");
        }
        
        // Clean up very old sessions
        $oldSessions = DB::table('sessions')
            ->where('last_activity', '<', now()->subDays(7)->timestamp)
            ->count();
            
        if ($oldSessions > 0) {
            DB::table('sessions')
                ->where('last_activity', '<', now()->subDays(7)->timestamp)
                ->delete();
                
            $this->info("Cleaned up {$oldSessions} old sessions");
        }
        
        // Show current session stats
        $totalSessions = DB::table('sessions')->count();
        $activeSessions = DB::table('sessions')
            ->whereNotNull('user_id')
            ->where('last_activity', '>', now()->subHours(24)->timestamp)
            ->count();
            
        $this->info("Current sessions: {$totalSessions} total, {$activeSessions} active");
        $this->info('ScalaHosting session cleanup completed!');
        
        return 0;
    }
}
