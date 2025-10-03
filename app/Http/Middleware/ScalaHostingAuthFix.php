<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ScalaHostingAuthFix
{
    /**
     * Handle an incoming request - Fix ScalaHosting session issues during auth
     */
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = uniqid('req_');
        
        Log::info("🔵 ScalaHosting Auth Fix - START", [
            'request_id' => $requestId,
            'url' => $request->url(),
            'method' => $request->method(),
            'user_agent' => $request->userAgent(),
            'ip' => $request->ip(),
            'has_session' => $request->hasSession(),
            'session_started' => $request->hasSession() ? $request->session()->isStarted() : false,
            'cookies' => $request->cookies->all(),
        ]);

        // Only apply for ScalaHosting
        if (!str_contains(config('app.url'), 'maharattraining.websoft.asia')) {
            Log::info("⚪ ScalaHosting Auth Fix - SKIPPED (not ScalaHosting)", ['request_id' => $requestId]);
            return $next($request);
        }

        try {
            Log::info("🟡 ScalaHosting Auth Fix - Processing session consistency", ['request_id' => $requestId]);
            
            // Handle session consistency for ScalaHosting
            $this->ensureSessionConsistency($request, $requestId);
            
            Log::info("🟡 ScalaHosting Auth Fix - Calling next middleware", ['request_id' => $requestId]);
            $response = $next($request);
            
            Log::info("🟡 ScalaHosting Auth Fix - Response received, fixing cookies", [
                'request_id' => $requestId,
                'status' => $response->getStatusCode()
            ]);
            
            // Fix cookies after response for ScalaHosting
            $this->fixScalaHostingCookies($request, $response, $requestId);
            
            // Add cache-busting headers to prevent browser caching issues
            $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate');
            $response->headers->set('Pragma', 'no-cache');
            $response->headers->set('Expires', '0');
            
            // Add ScalaHosting diagnostic headers
            $response->headers->set('X-ScalaHosting-Debug', 'Laravel-OK');
            $response->headers->set('X-Request-ID', $requestId);
            $response->headers->set('X-Session-ID', $request->session()->getId());
            $response->headers->set('X-Laravel-Status', 'SUCCESS');
            
            Log::info("🟢 ScalaHosting Auth Fix - COMPLETED", [
                'request_id' => $requestId,
                'response_status' => $response->getStatusCode(),
                'response_headers_count' => count($response->headers->all()),
                'content_length' => strlen($response->getContent()),
                'memory_usage' => memory_get_usage(true),
                'peak_memory' => memory_get_peak_usage(true),
            ]);
            return $response;
            
        } catch (\Exception $e) {
            Log::error('🔴 ScalaHosting Auth Fix - CRITICAL ERROR', [
                'request_id' => $requestId,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'url' => $request->url(),
                'user_id' => $request->user()?->id,
            ]);
            
            return $next($request);
        }
    }
    
    /**
     * Ensure session consistency for ScalaHosting
     */
    private function ensureSessionConsistency(Request $request, string $requestId): void
    {
        Log::info("🔍 Session Consistency Check - START", [
            'request_id' => $requestId,
            'session_driver' => config('session.driver'),
            'session_lifetime' => config('session.lifetime'),
        ]);

        if (config('session.driver') !== 'database') {
            Log::info("⚪ Session Consistency - SKIPPED (not database driver)", [
                'request_id' => $requestId,
                'driver' => config('session.driver')
            ]);
            return;
        }
        
        // Check if session is available before accessing it
        if (!$request->hasSession()) {
            Log::warning("⚠️ Session Consistency - NO SESSION AVAILABLE", [
                'request_id' => $requestId,
                'has_session' => false,
            ]);
            return;
        }

        if (!$request->session()->isStarted()) {
            Log::warning("⚠️ Session Consistency - SESSION NOT STARTED", [
                'request_id' => $requestId,
                'has_session' => true,
                'session_started' => false,
            ]);
            return;
        }
        
        $sessionId = $request->session()->getId();
        $cookieSessionId = $request->cookie('maharat_session');
        
        Log::info("🔍 Session IDs Comparison", [
            'request_id' => $requestId,
            'current_session_id' => $sessionId,
            'cookie_session_id' => $cookieSessionId,
            'ids_match' => $sessionId === $cookieSessionId,
        ]);
        
        // RETURNING USER FIX: Handle existing sessions properly
        // Check if we need to restore authentication (either session mismatch OR user not authenticated)
        $needsAuthRestoration = ($cookieSessionId && $cookieSessionId !== $sessionId) || !auth()->check();
        
        if ($needsAuthRestoration) {
            
            Log::info("🔄 RETURNING USER DETECTED - Authentication restoration needed", [
                'request_id' => $requestId,
                'cookie_session' => $cookieSessionId,
                'current_session' => $sessionId,
                'session_ids_match' => $cookieSessionId === $sessionId,
                'is_authenticated' => auth()->check(),
                'reason' => $cookieSessionId !== $sessionId ? 'session_mismatch' : 'not_authenticated',
            ]);
            
            // Check if the cookie session exists in database and is still valid
            $sessionLifetime = config('session.lifetime', 120) * 60;
            $minLastActivity = time() - $sessionLifetime;
            
            Log::info("🔍 Checking cookie session in database", [
                'request_id' => $requestId,
                'cookie_session_id' => $cookieSessionId,
                'session_lifetime_seconds' => $sessionLifetime,
                'min_last_activity' => $minLastActivity,
                'current_time' => time(),
            ]);
            
            $cookieSession = DB::table('sessions')
                ->where('id', $cookieSessionId)
                ->where('last_activity', '>', $minLastActivity)
                ->first();
            
            if ($cookieSession) {
                Log::info("✅ VALID COOKIE SESSION FOUND - Attempting to restore", [
                    'request_id' => $requestId,
                    'cookie_session' => $cookieSessionId,
                    'user_id' => $cookieSession->user_id,
                    'last_activity' => $cookieSession->last_activity,
                    'last_activity_human' => date('Y-m-d H:i:s', $cookieSession->last_activity),
                    'age_seconds' => time() - $cookieSession->last_activity,
                ]);
                
                try {
                    Log::info("🔄 Attempting session restoration", [
                        'request_id' => $requestId,
                        'old_session_id' => $sessionId,
                        'restoring_session_id' => $cookieSessionId,
                    ]);
                    
                    // Properly restore the session
                    $request->session()->setId($cookieSessionId);
                    $request->session()->start();
                    
                    Log::info("✅ Session ID set successfully", [
                        'request_id' => $requestId,
                        'new_session_id' => $request->session()->getId(),
                    ]);
                    
                    // Update last activity
                    $updateResult = DB::table('sessions')
                        ->where('id', $cookieSessionId)
                        ->update([
                            'last_activity' => time(),
                            'ip_address' => $request->ip(),
                            'user_agent' => $request->userAgent(),
                        ]);
                        
                    Log::info("✅ Session restored successfully", [
                        'request_id' => $requestId,
                        'restored_session_id' => $cookieSessionId,
                        'updated_rows' => $updateResult,
                        'user_id' => $cookieSession->user_id,
                    ]);
                    
                    // Restore user authentication for the restored session
                    if ($cookieSession && $cookieSession->user_id) {
                        Log::info("🔄 Restoring user authentication", [
                            'request_id' => $requestId,
                            'user_id' => $cookieSession->user_id,
                            'session_id' => $cookieSessionId,
                        ]);
                        
                        try {
                            // Find and authenticate the user
                            $user = \App\Models\User::find($cookieSession->user_id);
                            if ($user) {
                                // Set the authenticated user using multiple methods to ensure it works
                                auth()->login($user);
                                
                                // Also set the user in the session
                                $request->session()->put('login_web_' . sha1('App\Models\User'), $user->id);
                                
                                // Verify authentication was set
                                $isAuthenticated = auth()->check();
                                $authenticatedUser = auth()->user();
                                
                                Log::info("✅ User authentication restored", [
                                    'request_id' => $requestId,
                                    'user_id' => $user->id,
                                    'user_email' => $user->email,
                                    'session_id' => $cookieSessionId,
                                    'is_authenticated' => $isAuthenticated,
                                    'authenticated_user_id' => $authenticatedUser?->id,
                                    'session_login_key' => 'login_web_' . sha1('App\Models\User'),
                                ]);
                                
                                if (!$isAuthenticated) {
                                    Log::error("🔴 Authentication restoration failed - user not authenticated", [
                                        'request_id' => $requestId,
                                        'user_id' => $user->id,
                                        'session_id' => $cookieSessionId,
                                    ]);
                                }
                            } else {
                                Log::warning("⚠️ User not found for restored session", [
                                    'request_id' => $requestId,
                                    'user_id' => $cookieSession->user_id,
                                    'session_id' => $cookieSessionId,
                                ]);
                            }
                        } catch (\Exception $e) {
                            Log::error("🔴 Failed to restore user authentication", [
                                'request_id' => $requestId,
                                'error' => $e->getMessage(),
                                'file' => $e->getFile(),
                                'line' => $e->getLine(),
                                'user_id' => $cookieSession->user_id,
                                'session_id' => $cookieSessionId,
                                'trace' => $e->getTraceAsString(),
                            ]);
                        }
                    }
                        
                } catch (\Exception $e) {
                    Log::error('🔴 FAILED TO RESTORE SESSION', [
                        'request_id' => $requestId,
                        'error' => $e->getMessage(),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                        'cookie_session' => $cookieSessionId,
                        'trace' => $e->getTraceAsString(),
                    ]);
                    // Fall through to create new session
                }
                
            } else {
                Log::info("❌ Cookie session expired/invalid - Cleaning up", [
                    'request_id' => $requestId,
                    'cookie_session' => $cookieSessionId,
                    'current_session' => $sessionId,
                    'min_last_activity' => $minLastActivity,
                ]);
                
                // Clean up old session record if it exists
                $deletedRows = DB::table('sessions')->where('id', $cookieSessionId)->delete();
                
                Log::info("🗑️ Cleaned up expired session", [
                    'request_id' => $requestId,
                    'deleted_rows' => $deletedRows,
                    'cookie_session' => $cookieSessionId,
                ]);
            }
        }
        
        // Ensure current session exists in database
        $currentSessionId = $request->session()->getId();
        
        Log::info("🔍 Checking if current session exists in database", [
            'request_id' => $requestId,
            'current_session_id' => $currentSessionId,
        ]);
        
        $sessionExists = DB::table('sessions')
            ->where('id', $currentSessionId)
            ->exists();
            
        Log::info("🔍 Session existence check result", [
            'request_id' => $requestId,
            'session_id' => $currentSessionId,
            'exists_in_db' => $sessionExists,
        ]);
            
        if (!$sessionExists) {
            Log::info("➕ Creating missing session record", [
                'request_id' => $requestId,
                'session_id' => $currentSessionId,
                'user_id' => $request->user()?->id,
                'is_returning_user' => $cookieSessionId ? 'yes' : 'no',
            ]);
            
            try {
                // Create session record for new or restored sessions
                DB::table('sessions')->insert([
                    'id' => $currentSessionId,
                    'user_id' => $request->user()?->id,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'payload' => base64_encode(serialize($request->session()->all())),
                    'last_activity' => time(),
                ]);
                
                Log::info('✅ Session record created successfully', [
                    'request_id' => $requestId,
                    'session_id' => $currentSessionId,
                    'user_id' => $request->user()?->id,
                    'is_returning_user' => $cookieSessionId ? 'yes' : 'no'
                ]);
                
            } catch (\Exception $e) {
                Log::error('🔴 FAILED TO CREATE SESSION RECORD', [
                    'request_id' => $requestId,
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'session_id' => $currentSessionId,
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        } else {
            Log::info("✅ Session record already exists", [
                'request_id' => $requestId,
                'session_id' => $currentSessionId,
            ]);
        }
        
        Log::info("🔍 Session Consistency Check - COMPLETED", [
            'request_id' => $requestId,
            'final_session_id' => $request->session()->getId(),
        ]);
    }
    
    /**
     * Fix cookies for ScalaHosting after response
     */
    private function fixScalaHostingCookies(Request $request, Response $response, string $requestId): void
    {
        Log::info("🍪 Cookie Fix - START", [
            'request_id' => $requestId,
            'has_session' => $request->hasSession(),
            'session_started' => $request->hasSession() ? $request->session()->isStarted() : false,
        ]);

        // Check if session is available before accessing it
        if (!$request->hasSession() || !$request->session()->isStarted()) {
            Log::warning("⚠️ Cookie Fix - SKIPPED (session not available)", [
                'request_id' => $requestId,
                'has_session' => $request->hasSession(),
                'session_started' => $request->hasSession() ? $request->session()->isStarted() : false,
            ]);
            return;
        }
        
        // Ensure session cookie is properly set for ScalaHosting
        $sessionId = $request->session()->getId();
        $cookieSessionId = $request->cookie('maharat_session');
        
        Log::info("🍪 Cookie comparison", [
            'request_id' => $requestId,
            'current_session_id' => $sessionId,
            'cookie_session_id' => $cookieSessionId,
            'needs_cookie_fix' => $sessionId && $sessionId !== $cookieSessionId,
        ]);
        
        if ($sessionId && $sessionId !== $cookieSessionId) {
            Log::info("🍪 Setting new session cookie", [
                'request_id' => $requestId,
                'old_cookie' => $cookieSessionId,
                'new_session' => $sessionId,
                'lifetime_minutes' => config('session.lifetime', 120),
                'domain' => '.maharattraining.websoft.asia',
            ]);
            
            try {
                // Force set the correct session cookie with ScalaHosting-specific settings
                $cookie = cookie(
                    'maharat_session',
                    $sessionId,
                    config('session.lifetime', 120) * 60, // Convert minutes to seconds
                    config('session.path', '/'),
                    '.maharattraining.websoft.asia', // Explicit domain for ScalaHosting
                    true, // Secure - HTTPS only
                    true, // HTTP only
                    false, // Raw
                    'lax' // Same site
                );
                
                $response->headers->setCookie($cookie);
                
                Log::info('✅ Session cookie set successfully', [
                    'request_id' => $requestId,
                    'old_cookie' => $cookieSessionId,
                    'new_session' => $sessionId,
                    'domain' => '.maharattraining.websoft.asia',
                    'secure' => true,
                    'lifetime_seconds' => config('session.lifetime', 120) * 60,
                ]);
                
            } catch (\Exception $e) {
                Log::error('🔴 FAILED TO SET SESSION COOKIE', [
                    'request_id' => $requestId,
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'session_id' => $sessionId,
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        } else {
            Log::info("✅ Cookie Fix - No changes needed", [
                'request_id' => $requestId,
                'session_id' => $sessionId,
                'cookie_id' => $cookieSessionId,
            ]);
        }
        
        Log::info("🍪 Cookie Fix - COMPLETED", ['request_id' => $requestId]);
    }
}
