<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DebugMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            // Only log in debug mode and for non-API requests to reduce log spam
            $shouldLog = config('app.debug') && 
                        !$request->is('api/*') && 
                        !$request->is('build/*') && 
                        !str_contains($request->path(), 'assets') &&
                        !str_contains($request->path(), 'favicon');
            
            if ($shouldLog) {
                $requestId = uniqid('debug_');
                
                \Log::info('📊 REQUEST DEBUG - START', [
                    'request_id' => $requestId,
                    'url' => $request->url(),
                    'method' => $request->method(),
                    'route_name' => $request->route()?->getName(),
                    'user_id' => $request->user()?->id,
                    'user_email' => $request->user()?->email,
                    'session_id' => $request->hasSession() ? $request->session()->getId() : 'NO_SESSION',
                    'has_session' => $request->hasSession(),
                    'session_started' => $request->hasSession() ? $request->session()->isStarted() : false,
                    'cookies' => $request->cookies->all(),
                    'headers' => [
                        'user_agent' => $request->userAgent(),
                        'x_inertia' => $request->header('X-Inertia'),
                        'accept' => $request->header('Accept'),
                        'referer' => $request->header('Referer'),
                    ],
                    'ip' => $request->ip(),
                    'timestamp' => now()->toISOString(),
                ]);
                
                // Store request ID for response logging
                $request->attributes->set('debug_request_id', $requestId);
            }

            $response = $next($request);

            if ($shouldLog) {
                $requestId = $request->attributes->get('debug_request_id', 'unknown');
                
                // Log successful response
                \Log::info('📊 RESPONSE DEBUG - SUCCESS', [
                    'request_id' => $requestId,
                    'url' => $request->url(),
                    'status' => $response->getStatusCode(),
                    'route_name' => $request->route()?->getName(),
                    'final_session_id' => $request->hasSession() ? $request->session()->getId() : 'NO_SESSION',
                    'response_headers' => [
                        'content_type' => $response->headers->get('Content-Type'),
                        'set_cookie' => $response->headers->get('Set-Cookie'),
                    ],
                    'timestamp' => now()->toISOString(),
                ]);
            }

            return $response;

        } catch (\Exception $e) {
            $requestId = $request->attributes->get('debug_request_id', 'unknown');
            
            // Log detailed error information
            \Log::error('🔴 DEBUG MIDDLEWARE - APPLICATION ERROR', [
                'request_id' => $requestId,
                'url' => $request->url(),
                'method' => $request->method(),
                'route_name' => $request->route()?->getName(),
                'user_id' => $request->user()?->id,
                'user_email' => $request->user()?->email,
                'session_id' => $request->hasSession() ? $request->session()->getId() : 'NO_SESSION',
                'error_message' => $e->getMessage(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'error_class' => get_class($e),
                'error_trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
                'cookies' => $request->cookies->all(),
                'headers' => $request->headers->all(),
                'timestamp' => now()->toISOString(),
            ]);

            throw $e;
        }
    }
}