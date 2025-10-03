<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class FixScalaHostingSession
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only apply this fix for ScalaHosting environment
        if (!str_contains(config('app.url'), 'maharattraining.websoft.asia')) {
            return $next($request);
        }
        
        try {
            $sessionId = $request->session()->getId();
            
            // Only check session validity for non-AJAX requests to avoid disrupting API calls
            if (!$request->ajax() && !$request->expectsJson() && $request->cookies->has('maharat_session') && config('session.driver') === 'database') {
                $sessionTable = config('session.table', 'sessions');
                
                // Check if session exists in database
                $sessionExists = DB::table($sessionTable)
                    ->where('id', $sessionId)
                    ->exists();
                
                if (!$sessionExists) {
                    // Session cookie exists but no database record
                    // Only regenerate if this is not an Inertia request to avoid disrupting the flow
                    if (!$request->header('X-Inertia')) {
                        Log::info('ScalaHosting session fix: Creating new session', [
                            'old_session_id' => $sessionId,
                            'url' => $request->url(),
                            'user_agent' => $request->userAgent()
                        ]);
                        
                        // Start a fresh session
                        $request->session()->invalidate();
                        $request->session()->regenerate(true);
                        
                        $newSessionId = $request->session()->getId();
                        
                        Log::info('ScalaHosting session fix: New session created', [
                            'new_session_id' => $newSessionId,
                            'url' => $request->url()
                        ]);
                    }
                }
            }
            
            return $next($request);
            
        } catch (\Exception $e) {
            Log::error('ScalaHosting session fix error', [
                'error' => $e->getMessage(),
                'url' => $request->url(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Don't regenerate session on error for Inertia requests
            if (!$request->header('X-Inertia')) {
                try {
                    $request->session()->invalidate();
                    $request->session()->regenerate(true);
                } catch (\Exception $regenerateError) {
                    Log::error('Failed to regenerate session', [
                        'error' => $regenerateError->getMessage()
                    ]);
                }
            }
            
            return $next($request);
        }
    }
}

