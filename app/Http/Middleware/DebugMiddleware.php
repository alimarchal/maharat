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
            // Only log non-API requests and important routes to reduce log spam
            $shouldLog = !$request->is('api/*') && 
                        !$request->is('build/*') && 
                        !str_contains($request->path(), 'assets') &&
                        !str_contains($request->path(), 'favicon');
            
            if ($shouldLog) {
                \Log::info('Request Debug', [
                    'url' => $request->url(),
                    'method' => $request->method(),
                    'route_name' => $request->route()?->getName(),
                    'user_id' => $request->user()?->id,
                    'user_email' => $request->user()?->email,
                    'session_id' => $request->session()->getId(),
                ]);
            }

            $response = $next($request);

            if ($shouldLog) {
                // Log successful response
                \Log::info('Response Debug', [
                    'url' => $request->url(),
                    'status' => $response->getStatusCode(),
                    'route_name' => $request->route()?->getName(),
                ]);
            }

            return $response;

        } catch (\Exception $e) {
            // Log detailed error information
            \Log::error('Debug Middleware Error', [
                'url' => $request->url(),
                'method' => $request->method(),
                'route_name' => $request->route()?->getName(),
                'user_id' => $request->user()?->id,
                'error_message' => $e->getMessage(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'error_trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);

            throw $e;
        }
    }
}