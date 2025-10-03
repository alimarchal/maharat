<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;

class DebugController extends Controller
{
    /**
     * Show debug information including recent errors
     */
    public function showDebugInfo(Request $request)
    {
        // Only allow for ScalaHosting environment
        if (!str_contains(config('app.url'), 'maharattraining.websoft.asia')) {
            return response()->json(['error' => 'Debug mode not available'], 403);
        }

        // Get session data for debugging
        $sessionData = [];
        if ($request->hasSession()) {
            $sessionData = [
                'session_id' => $request->session()->getId(),
                'session_data' => $request->session()->all(),
                'auth_guard' => auth()->guard()->getName(),
                'auth_user_id' => auth()->id(),
                'auth_user_email' => auth()->user()?->email,
            ];
        }

        // Get cookie session data from database
        $cookieSessionData = null;
        if ($request->cookie('maharat_session')) {
            $cookieSessionId = $request->cookie('maharat_session');
            $cookieSessionData = \DB::table('sessions')
                ->where('id', $cookieSessionId)
                ->first();
        }

        $debugInfo = [
            'timestamp' => now()->toISOString(),
            'url' => $request->url(),
            'user_id' => $request->user()?->id,
            'session_id' => $request->hasSession() ? $request->session()->getId() : 'NO_SESSION',
            'is_returning_user' => $request->cookie('maharat_session') ? 'yes' : 'no',
            'cookies' => $request->cookies->all(),
            'session_data' => $sessionData,
            'cookie_session_data' => $cookieSessionData,
        ];

        // Get recent Laravel log entries
        $laravelLogPath = storage_path('logs/laravel.log');
        $phpErrorLogPath = storage_path('logs/php-errors.log');
        
        $recentLaravelLogs = [];
        $recentPhpErrors = [];

        if (File::exists($laravelLogPath)) {
            $laravelLogs = File::get($laravelLogPath);
            $lines = explode("\n", $laravelLogs);
            $recentLaravelLogs = array_slice($lines, -50); // Last 50 lines
        }

        if (File::exists($phpErrorLogPath)) {
            $phpErrors = File::get($phpErrorLogPath);
            $lines = explode("\n", $phpErrors);
            $recentPhpErrors = array_slice($lines, -50); // Last 50 lines
        }

        // Get PHP error reporting status
        $phpDebugInfo = [
            'error_reporting' => error_reporting(),
            'display_errors' => ini_get('display_errors'),
            'log_errors' => ini_get('log_errors'),
            'error_log' => ini_get('error_log'),
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
        ];

        return response()->view('debug', [
            'debugInfo' => $debugInfo,
            'recentLaravelLogs' => $recentLaravelLogs,
            'recentPhpErrors' => $recentPhpErrors,
            'phpDebugInfo' => $phpDebugInfo,
            'laravelLogPath' => $laravelLogPath,
            'phpErrorLogPath' => $phpErrorLogPath,
        ]);
    }

    /**
     * Show recent errors only
     */
    public function showRecentErrors(Request $request)
    {
        // Only allow for ScalaHosting environment
        if (!str_contains(config('app.url'), 'maharattraining.websoft.asia')) {
            return response()->json(['error' => 'Debug mode not available'], 403);
        }

        $laravelLogPath = storage_path('logs/laravel.log');
        $phpErrorLogPath = storage_path('logs/php-errors.log');
        
        $errors = [];

        if (File::exists($laravelLogPath)) {
            $laravelLogs = File::get($laravelLogPath);
            $lines = explode("\n", $laravelLogs);
            
            // Look for error lines in the last 100 lines
            $recentLines = array_slice($lines, -100);
            foreach ($recentLines as $line) {
                if (str_contains($line, 'ERROR') || str_contains($line, 'CRITICAL') || str_contains($line, '🔴')) {
                    $errors[] = $line;
                }
            }
        }

        if (File::exists($phpErrorLogPath)) {
            $phpErrors = File::get($phpErrorLogPath);
            $lines = explode("\n", $phpErrors);
            
            // Get all PHP errors
            foreach ($lines as $line) {
                if (!empty(trim($line))) {
                    $errors[] = $line;
                }
            }
        }

        return response()->json([
            'timestamp' => now()->toISOString(),
            'error_count' => count($errors),
            'errors' => $errors,
            'laravel_log_exists' => File::exists($laravelLogPath),
            'php_error_log_exists' => File::exists($phpErrorLogPath),
        ]);
    }

    /**
     * Clear logs (for testing)
     */
    public function clearLogs(Request $request)
    {
        // Only allow for ScalaHosting environment
        if (!str_contains(config('app.url'), 'maharattraining.websoft.asia')) {
            return response()->json(['error' => 'Debug mode not available'], 403);
        }

        $laravelLogPath = storage_path('logs/laravel.log');
        $phpErrorLogPath = storage_path('logs/php-errors.log');
        
        $cleared = [];
        
        if (File::exists($laravelLogPath)) {
            File::put($laravelLogPath, '');
            $cleared[] = 'Laravel log cleared';
        }
        
        if (File::exists($phpErrorLogPath)) {
            File::put($phpErrorLogPath, '');
            $cleared[] = 'PHP error log cleared';
        }

        return response()->json([
            'message' => 'Logs cleared successfully',
            'cleared' => $cleared,
            'timestamp' => now()->toISOString(),
        ]);
    }
}
