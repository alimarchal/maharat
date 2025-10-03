<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ScalaHostingServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Only apply fixes for ScalaHosting
        if (!config('scalahosting.enabled')) {
            return;
        }

        // Fix session configuration for ScalaHosting
        $this->configureSessionForScalaHosting();
        
        // Handle session events
        $this->handleSessionEvents();
    }

    /**
     * Configure session settings specifically for ScalaHosting
     */
    private function configureSessionForScalaHosting(): void
    {
        // Override session configuration for ScalaHosting with returning user fixes
        config([
            'session.driver' => 'database',
            'session.lifetime' => 1440, // 24 hours for better returning user experience
            'session.encrypt' => false,
            'session.path' => '/',
            'session.domain' => '.maharattraining.websoft.asia', // Explicit domain
            'session.secure' => true, // HTTPS only
            'session.http_only' => true,
            'session.same_site' => 'lax',
            'session.cookie' => 'maharat_session', // Explicit cookie name
            'session.expire_on_close' => false, // Keep sessions for returning users
        ]);
        
        Log::info('ScalaHosting: Session configuration applied', [
            'driver' => config('session.driver'),
            'lifetime' => config('session.lifetime'),
            'domain' => config('session.domain'),
            'cookie' => config('session.cookie')
        ]);
    }

    /**
     * Handle session-related events for ScalaHosting
     */
    private function handleSessionEvents(): void
    {
        // Listen for session start events
        $this->app['events']->listen('session.started', function ($session) {
            try {
                // Ensure session exists in database for ScalaHosting
                $sessionId = $session->getId();
                
                if (config('session.driver') === 'database') {
                    $exists = DB::table('sessions')
                        ->where('id', $sessionId)
                        ->exists();
                    
                    if (!$exists) {
                        // Create session record
                        DB::table('sessions')->insert([
                            'id' => $sessionId,
                            'user_id' => auth()->id(),
                            'ip_address' => request()->ip(),
                            'user_agent' => request()->userAgent(),
                            'payload' => base64_encode(serialize([])),
                            'last_activity' => time(),
                        ]);
                        
                        if (config('scalahosting.debug.log_session_fixes')) {
                            Log::info('ScalaHosting: Created session record on start', [
                                'session_id' => $sessionId
                            ]);
                        }
                    }
                }
            } catch (\Exception $e) {
                Log::error('ScalaHosting session start error', [
                    'error' => $e->getMessage()
                ]);
            }
        });
    }
}
