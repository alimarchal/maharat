<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ErrorDebugMiddleware
{
    /**
     * Handle an incoming request - Debug middleware to catch hidden errors
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only apply for ScalaHosting debugging
        if (!str_contains(config('app.url'), 'maharattraining.websoft.asia')) {
            return $next($request);
        }

        $requestId = uniqid('debug_');
        
        Log::info("🔍 Error Debug Middleware - START", [
            'request_id' => $requestId,
            'url' => $request->url(),
            'method' => $request->method(),
            'route_name' => $request->route()?->getName(),
            'user_id' => $request->user()?->id,
            'session_id' => $request->hasSession() ? $request->session()->getId() : 'NO_SESSION',
            'is_returning_user' => $request->cookie('maharat_session') ? 'yes' : 'no',
        ]);

        try {
            // Enable error reporting for this request
            $oldErrorReporting = error_reporting(E_ALL);
            $oldDisplayErrors = ini_set('display_errors', '1');
            $oldLogErrors = ini_set('log_errors', '1');
            
            // Capture any output that might be generated
            ob_start();
            
            Log::info("🔍 Error Debug Middleware - Calling next middleware", [
                'request_id' => $requestId,
            ]);
            
            $response = $next($request);
            
            // Get any output that was captured
            $output = ob_get_clean();
            
            Log::info("🔍 Error Debug Middleware - Response received", [
                'request_id' => $requestId,
                'status' => $response->getStatusCode(),
                'captured_output' => $output,
                'response_size' => strlen($response->getContent()),
            ]);
            
            // Restore error reporting settings
            error_reporting($oldErrorReporting);
            ini_set('display_errors', $oldDisplayErrors);
            ini_set('log_errors', $oldLogErrors);
            
            // If there was captured output, log it as it might indicate an error
            if (!empty($output)) {
                Log::warning("⚠️ Captured output during request - might indicate error", [
                    'request_id' => $requestId,
                    'output' => $output,
                    'url' => $request->url(),
                    'user_id' => $request->user()?->id,
                ]);
            }
            
            // Check for common error indicators in response
            $content = $response->getContent();
            if (str_contains($content, 'Fatal error') || 
                str_contains($content, 'Parse error') || 
                str_contains($content, 'Warning:') || 
                str_contains($content, 'Notice:') ||
                str_contains($content, 'Error:') ||
                str_contains($content, 'Exception')) {
                
                Log::error("🔴 ERROR DETECTED IN RESPONSE CONTENT", [
                    'request_id' => $requestId,
                    'url' => $request->url(),
                    'user_id' => $request->user()?->id,
                    'response_content' => $content,
                    'response_status' => $response->getStatusCode(),
                ]);
            }
            
            Log::info("✅ Error Debug Middleware - COMPLETED", [
                'request_id' => $requestId,
                'status' => $response->getStatusCode(),
            ]);
            
            return $response;
            
        } catch (\Throwable $e) {
            // Clean up output buffer
            if (ob_get_level()) {
                ob_end_clean();
            }
            
            Log::error("🔴 Error Debug Middleware - EXCEPTION CAUGHT", [
                'request_id' => $requestId,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'class' => get_class($e),
                'url' => $request->url(),
                'user_id' => $request->user()?->id,
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Re-throw the exception
            throw $e;
        }
    }
}
