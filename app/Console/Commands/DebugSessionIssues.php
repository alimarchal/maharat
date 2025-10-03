<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DebugSessionIssues extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'debug:sessions {--tail : Follow log in real-time} {--clear : Clear old sessions}';

    /**
     * The description of the console command.
     */
    protected $description = 'Debug session issues and monitor session activity';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if ($this->option('clear')) {
            $this->clearOldSessions();
            return;
        }

        if ($this->option('tail')) {
            $this->tailLogs();
            return;
        }

        $this->showSessionStats();
    }

    private function clearOldSessions()
    {
        $this->info('🧹 Clearing old sessions...');
        
        $sessionLifetime = config('session.lifetime', 120) * 60;
        $cutoff = time() - $sessionLifetime;
        
        $deleted = DB::table('sessions')
            ->where('last_activity', '<', $cutoff)
            ->delete();
            
        $this->info("✅ Deleted {$deleted} expired sessions");
        
        Log::info('Session cleanup completed', [
            'deleted_sessions' => $deleted,
            'cutoff_time' => $cutoff,
            'cutoff_human' => date('Y-m-d H:i:s', $cutoff)
        ]);
    }

    private function showSessionStats()
    {
        $this->info('📊 Current Session Statistics');
        $this->line('');

        // Total sessions
        $totalSessions = DB::table('sessions')->count();
        $this->info("Total sessions: {$totalSessions}");

        // Active sessions (last 30 minutes)
        $activeSessions = DB::table('sessions')
            ->where('last_activity', '>', time() - 1800)
            ->count();
        $this->info("Active sessions (30 min): {$activeSessions}");

        // Sessions with users
        $userSessions = DB::table('sessions')
            ->whereNotNull('user_id')
            ->count();
        $this->info("Authenticated sessions: {$userSessions}");

        // Recent sessions
        $this->line('');
        $this->info('🕒 Recent Sessions:');
        
        $recentSessions = DB::table('sessions')
            ->leftJoin('users', 'sessions.user_id', '=', 'users.id')
            ->select([
                'sessions.id',
                'sessions.user_id',
                'users.email',
                'sessions.ip_address',
                'sessions.last_activity'
            ])
            ->orderBy('sessions.last_activity', 'desc')
            ->limit(10)
            ->get();

        foreach ($recentSessions as $session) {
            $lastActivity = date('Y-m-d H:i:s', $session->last_activity);
            $age = time() - $session->last_activity;
            $ageStr = $age < 60 ? "{$age}s ago" : floor($age/60) . "m ago";
            
            $this->line("  {$session->id} | {$session->email} | {$session->ip_address} | {$lastActivity} ({$ageStr})");
        }

        // Configuration
        $this->line('');
        $this->info('⚙️ Session Configuration:');
        $this->line("  Driver: " . config('session.driver'));
        $this->line("  Lifetime: " . config('session.lifetime') . " minutes");
        $this->line("  Cookie: " . config('session.cookie'));
        $this->line("  Domain: " . config('session.domain'));
        $this->line("  Secure: " . (config('session.secure') ? 'Yes' : 'No'));
    }

    private function tailLogs()
    {
        $this->info('📡 Tailing session logs... (Press Ctrl+C to stop)');
        $this->line('');

        $logFile = storage_path('logs/laravel.log');
        
        if (!file_exists($logFile)) {
            $this->error('Log file not found: ' . $logFile);
            return;
        }

        // Get current file size with error handling
        $lastSize = 0;
        try {
            $lastSize = filesize($logFile);
        } catch (\Exception $e) {
            $this->warn('Could not get file size, starting from end: ' . $e->getMessage());
            $lastSize = 0;
        }

        while (true) {
            clearstatcache();
            
            try {
                $currentSize = filesize($logFile);
            } catch (\Exception $e) {
                $this->warn('Error reading file size: ' . $e->getMessage());
                usleep(500000);
                continue;
            }

            if ($currentSize > $lastSize) {
                // Read new content
                $handle = fopen($logFile, 'r');
                fseek($handle, $lastSize);
                
                while (($line = fgets($handle)) !== false) {
                    // Only show session-related logs
                    if (str_contains($line, 'ScalaHosting') || 
                        str_contains($line, 'Session') || 
                        str_contains($line, 'REQUEST DEBUG') ||
                        str_contains($line, 'RESPONSE DEBUG')) {
                        
                        // Color code the output
                        if (str_contains($line, '🔴') || str_contains($line, 'ERROR')) {
                            $this->error(trim($line));
                        } elseif (str_contains($line, '⚠️') || str_contains($line, 'WARNING')) {
                            $this->warn(trim($line));
                        } elseif (str_contains($line, '✅') || str_contains($line, '🟢')) {
                            $this->info(trim($line));
                        } else {
                            $this->line(trim($line));
                        }
                    }
                }
                
                fclose($handle);
                $lastSize = $currentSize;
            }

            usleep(500000); // Sleep 0.5 seconds
        }
    }
}
