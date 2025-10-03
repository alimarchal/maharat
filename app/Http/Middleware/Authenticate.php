<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     */
    protected function redirectTo(Request $request): ?string
    {
        Log::info("🔍 Authenticate middleware - redirectTo called", [
            'url' => $request->url(),
            'has_session' => $request->hasSession(),
            'session_id' => $request->hasSession() ? $request->session()->getId() : 'NO_SESSION',
            'has_maharat_cookie' => $request->cookie('maharat_session') ? 'yes' : 'no',
            'cookie_session_id' => $request->cookie('maharat_session'),
            'expects_json' => $request->expectsJson(),
        ]);

        // Only apply ScalaHosting fix for returning users
        if (str_contains(config('app.url'), 'maharattraining.websoft.asia') && 
            $request->cookie('maharat_session') && 
            $request->hasSession()) {
            
            $sessionId = $request->session()->getId();
            $cookieSessionId = $request->cookie('maharat_session');
            
            Log::info("🔍 Authenticate middleware - checking returning user", [
                'url' => $request->url(),
                'session_id' => $sessionId,
                'cookie_session_id' => $cookieSessionId,
                'is_returning_user' => $cookieSessionId !== $sessionId ? 'yes' : 'no',
            ]);
            
            // If this is a returning user with session mismatch, try to restore authentication
            if ($cookieSessionId !== $sessionId) {
                try {
                    $sessionLifetime = config('session.lifetime', 120) * 60;
                    $minLastActivity = time() - $sessionLifetime;
                    
                    $cookieSession = DB::table('sessions')
                        ->where('id', $cookieSessionId)
                        ->where('last_activity', '>', $minLastActivity)
                        ->first();
                    
                    if ($cookieSession && $cookieSession->user_id) {
                        Log::info("🔄 Attempting to restore authentication for returning user", [
                            'user_id' => $cookieSession->user_id,
                            'session_id' => $cookieSessionId,
                        ]);
                        
                        // Find and authenticate the user
                        $user = \App\Models\User::find($cookieSession->user_id);
                        if ($user) {
                            // Set the authenticated user using multiple methods
                            auth()->login($user);
                            
                            // Also set the user in the session
                            $request->session()->put('login_web_' . sha1('App\Models\User'), $user->id);
                            
                            // Verify authentication was set
                            $isAuthenticated = auth()->check();
                            $authenticatedUser = auth()->user();
                            
                            Log::info("✅ Authentication restored for returning user", [
                                'user_id' => $user->id,
                                'user_email' => $user->email,
                                'session_id' => $cookieSessionId,
                                'is_authenticated' => $isAuthenticated,
                                'authenticated_user_id' => $authenticatedUser?->id,
                            ]);
                            
                            if ($isAuthenticated) {
                                // Don't redirect, continue with the request
                                return null;
                            } else {
                                Log::error("🔴 Authentication restoration failed in Authenticate middleware", [
                                    'user_id' => $user->id,
                                    'session_id' => $cookieSessionId,
                                ]);
                            }
                        }
                    }
                } catch (\Exception $e) {
                    Log::error("🔴 Failed to restore authentication in Authenticate middleware", [
                        'error' => $e->getMessage(),
                        'session_id' => $sessionId,
                        'cookie_session_id' => $cookieSessionId,
                    ]);
                }
            }
        }
        
        // For new users or when cookies are cleared, redirect to login
        Log::info("🔄 Redirecting to login page", [
            'url' => $request->url(),
            'reason' => 'User not authenticated',
            'has_cookie' => $request->cookie('maharat_session') ? 'yes' : 'no',
        ]);
        
        try {
            $loginUrl = route('login');
            Log::info("✅ Login route resolved successfully", [
                'login_url' => $loginUrl,
            ]);
            return $request->expectsJson() ? null : $loginUrl;
        } catch (\Exception $e) {
            Log::error("🔴 Failed to resolve login route", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Fallback to direct URL if route resolution fails
            return $request->expectsJson() ? null : '/login';
        }
    }
}