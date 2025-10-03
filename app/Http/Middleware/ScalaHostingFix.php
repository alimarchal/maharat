<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ScalaHostingFix
{
    /**
     * Handle an incoming request - ScalaHosting specific fixes
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only apply fixes for ScalaHosting environment
        if (!str_contains(config('app.url'), 'maharattraining.websoft.asia')) {
            return $next($request);
        }

        try {
            // Pre-request session fix for ScalaHosting
            $this->preRequestSessionFix($request);
            
            // Process the request
            $response = $next($request);
            
            // Post-request fixes for ScalaHosting
            $this->postRequestSessionFix($request, $response);
            
            return $response;
            
        } catch (\Exception $e) {
            Log::error('ScalaHosting Fix Error', [
                'error' => $e->getMessage(),
                'url' => $request->url(),
                'user_id' => $request->user()?->id,
                'trace' => $e->getTraceAsString()
            ]);
            
            // For ScalaHosting, try to recover gracefully
            return $this->handleScalaHostingError($request, $e);
        }
    }
    
    /**
     * Pre-request session fixes for ScalaHosting
     */
    private function preRequestSessionFix(Request $request): void
    {
        // Check if session is available before accessing it
        if (!$request->hasSession()) {
            // Session not yet available, skip session operations
            return;
        }
        
        // Ensure session is properly started for ScalaHosting
        if (!$request->session()->isStarted()) {
            $request->session()->start();
        }
        
        // Fix session domain issues on ScalaHosting
        if (config('session.driver') === 'database') {
            $sessionId = $request->session()->getId();
            
            // Ensure session exists in database
            $sessionExists = DB::table('sessions')
                ->where('id', $sessionId)
                ->exists();
                
            if (!$sessionExists && $request->user()) {
                // Create session record for authenticated users
                DB::table('sessions')->insert([
                    'id' => $sessionId,
                    'user_id' => $request->user()->id,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'payload' => base64_encode(serialize([])),
                    'last_activity' => time(),
                ]);
                
                Log::info('ScalaHosting: Created missing session record', [
                    'session_id' => $sessionId,
                    'user_id' => $request->user()->id
                ]);
            }
        }
    }
    
    /**
     * Post-request fixes for ScalaHosting
     */
    private function postRequestSessionFix(Request $request, Response $response): void
    {
        // Ensure proper cookie settings for ScalaHosting
        if ($response instanceof \Illuminate\Http\Response || $response instanceof \Illuminate\Http\JsonResponse) {
            
            // Fix cookie domain for ScalaHosting
            $cookies = $response->headers->getCookies();
            foreach ($cookies as $cookie) {
                if (str_contains($cookie->getName(), 'maharat')) {
                    // Ensure proper domain and security settings
                    $response->headers->setCookie(
                        cookie(
                            $cookie->getName(),
                            $cookie->getValue(),
                            $cookie->getExpiresTime(),
                            $cookie->getPath(),
                            '.maharattraining.websoft.asia', // Explicit domain
                            $cookie->isSecure(),
                            $cookie->isHttpOnly(),
                            false, // raw
                            $cookie->getSameSite()
                        )
                    );
                }
            }
        }
    }
    
    /**
     * Handle ScalaHosting specific errors gracefully
     */
    private function handleScalaHostingError(Request $request, \Exception $e): Response
    {
        // For ScalaHosting, try to return a working response even on errors
        if ($request->expectsJson() || $request->header('X-Inertia')) {
            return response()->json([
                'message' => 'ScalaHosting session error - please refresh',
                'error' => config('app.debug') ? $e->getMessage() : 'Session error'
            ], 500);
        }
        
        // For regular requests, redirect to login to reset session
        return redirect()->route('login')->with('error', 'Session error - please login again');
    }
}
