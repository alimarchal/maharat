<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class SessionCleanup
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            // Get initial session ID
            $sessionId = $request->session()->getId();
            
            Log::info('Session Debug - Start', [
                'url' => $request->url(),
                'session_id' => $sessionId,
                'user_id' => $request->user()?->id,
                'cookies' => $request->cookies->all()
            ]);
            
            // For database sessions, check if session exists in database
            if (config('session.driver') === 'database') {
                $sessionTable = config('session.table', 'sessions');
                $sessionData = DB::table($sessionTable)
                    ->where('id', $sessionId)
                    ->first();
                
                if (!$sessionData) {
                    Log::warning('Session not found in database', [
                        'session_id' => $sessionId,
                        'user_id' => $request->user()?->id,
                        'url' => $request->url()
                    ]);
                    
                    // Don't regenerate - let Laravel handle it naturally
                    // This prevents the session ID mismatch issue
                } else {
                    Log::info('Session found in database', [
                        'session_id' => $sessionId,
                        'last_activity' => $sessionData->last_activity,
                        'user_id' => $request->user()?->id
                    ]);
                }
            }
            
            $response = $next($request);
            
            // Log final session state
            $finalSessionId = $request->session()->getId();
            if ($finalSessionId !== $sessionId) {
                Log::info('Session ID changed during request', [
                    'url' => $request->url(),
                    'old_session' => $sessionId,
                    'new_session' => $finalSessionId,
                    'user_id' => $request->user()?->id
                ]);
            }
            
            // Clean up expired sessions periodically (1% chance)
            if (rand(1, 100) === 1) {
                $this->cleanupExpiredSessions();
            }
            
            return $response;
            
        } catch (\Exception $e) {
            Log::error('Session cleanup error', [
                'error' => $e->getMessage(),
                'url' => $request->url(),
                'session_id' => $request->session()->getId(),
                'user_id' => $request->user()?->id
            ]);
            
            // If session is corrupted, try to fix it
            try {
                // Clear any corrupted session data
                $request->session()->flush();
                $request->session()->regenerate();
                
                Log::info('Session regenerated due to error', [
                    'url' => $request->url(),
                    'user_id' => $request->user()?->id
                ]);
                
            } catch (\Exception $regenerateError) {
                Log::error('Session regeneration failed', [
                    'error' => $regenerateError->getMessage()
                ]);
                
                // Last resort: return error response
                if ($request->expectsJson()) {
                    return response()->json(['error' => 'Session error'], 500);
                }
                
                return redirect()->route('login')->with('error', 'Session expired. Please login again.');
            }
            
            return $next($request);
        }
    }
    
    /**
     * Clean up expired sessions
     */
    private function cleanupExpiredSessions(): void
    {
        try {
            if (config('session.driver') === 'database') {
                $expiredTime = now()->subMinutes(config('session.lifetime', 120));
                
                $deleted = DB::table(config('session.table', 'sessions'))
                    ->where('last_activity', '<', $expiredTime->timestamp)
                    ->delete();
                
                if ($deleted > 0) {
                    Log::info('Cleaned up expired sessions', ['count' => $deleted]);
                }
            }
        } catch (\Exception $e) {
            Log::error('Session cleanup failed', ['error' => $e->getMessage()]);
        }
    }
}
