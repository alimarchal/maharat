<?php

use App\Http\Middleware\LocaleMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            // Add ScalaHosting diagnostic routes
            if (str_contains(config('app.url'), 'maharattraining.websoft.asia')) {
                require base_path('routes/scalahosting-debug.php');
                require base_path('routes/scalahosting-fix.php');
            }
        }
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            // ScalaHosting fixes - moved after session middleware is available
            \App\Http\Middleware\ScalaHostingAuthFix::class,
            // Temporarily disabled aggressive session middleware
            // \App\Http\Middleware\FixScalaHostingSession::class,
            // \App\Http\Middleware\SessionCleanup::class,
            \App\Http\Middleware\DebugMiddleware::class,
            \App\Http\Middleware\ErrorDebugMiddleware::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\LocaleMiddleware::class,
        ]);
        
        // Ensure CSRF protection is enabled for web routes
        $middleware->validateCsrfTokens(except: [
            // Add any routes that should be excluded from CSRF protection
        ]);
    
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class, 
        ]);
    
        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Enable detailed error reporting for ScalaHosting debugging
        if (str_contains(config('app.url'), 'maharattraining.websoft.asia')) {
            // Enable error reporting for debugging
            error_reporting(E_ALL);
            ini_set('display_errors', '1');
            ini_set('display_startup_errors', '1');
            ini_set('log_errors', '1');
            ini_set('error_log', storage_path('logs/php-errors.log'));
        }
        
        // Add detailed logging for 500 errors to catch returning user issues
        $exceptions->render(function (\Throwable $e, $request) {
            // Only log for ScalaHosting and non-API requests
            if (str_contains(config('app.url'), 'maharattraining.websoft.asia') && 
                !$request->is('api/*') && 
                !$request->is('build/*')) {
                
                \Log::error('🔴 APPLICATION 500 ERROR - DETAILED DEBUG', [
                    'CRITICAL_INFO' => 'PHP Error Found - Check PHP error log for details',
                    'error_message' => $e->getMessage(),
                    'error_file' => $e->getFile(),
                    'error_line' => $e->getLine(),
                    'error_class' => get_class($e),
                    'url' => $request->url(),
                    'method' => $request->method(),
                    'route_name' => $request->route()?->getName(),
                    'user_id' => $request->user()?->id,
                    'user_email' => $request->user()?->email,
                    'session_id' => $request->hasSession() ? $request->session()->getId() : 'NO_SESSION',
                    'has_session' => $request->hasSession(),
                    'session_started' => $request->hasSession() ? $request->session()->isStarted() : false,
                    'cookies' => $request->cookies->all(),
                    'is_returning_user' => $request->cookie('maharat_session') ? 'yes' : 'no',
                    'cookie_session_id' => $request->cookie('maharat_session'),
                    'request_data' => $request->all(),
                    'middleware_completed' => 'YES - Check previous logs for ScalaHosting Auth Fix COMPLETED',
                    'php_error_log' => 'Check storage/logs/php-errors.log for PHP errors',
                    'error_trace' => $e->getTraceAsString(),
                    'timestamp' => now()->toISOString(),
                ]);
                
                // Return detailed error response for debugging
                $debugInfo = [
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'class' => get_class($e),
                    'url' => $request->url(),
                    'user_id' => $request->user()?->id,
                    'session_id' => $request->hasSession() ? $request->session()->getId() : 'NO_SESSION',
                    'trace' => $e->getTraceAsString(),
                ];
                
                // Return error response with debug info and no-cache headers
                $response = response()->view('errors.500', ['exception' => $e, 'debug' => $debugInfo], 500);
                $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate');
                $response->headers->set('Pragma', 'no-cache');
                $response->headers->set('Expires', '0');
                return $response;
            }
            
            // Don't interfere with normal error handling
            return null;
        });
    })->create();
