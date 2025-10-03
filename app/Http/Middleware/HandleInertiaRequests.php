<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        try {
            // Log the request details (only in debug mode)
            if (config('app.debug')) {
                \Log::info('Inertia Request', [
                    'url' => $request->url(),
                    'method' => $request->method(),
                    'user_id' => $request->user()?->id,
                    'route_name' => $request->route()?->getName(),
                ]);
            }

            // Safely get user data without complex relationships
            $userData = null;
            if ($request->user()) {
                try {
                    // Get basic user data
                    $user = $request->user();
                    
                    // Convert roles and permissions to simple arrays
                    \Log::info('🔍 Loading user permissions for returning user', [
                        'user_id' => $user->id,
                        'user_email' => $user->email,
                        'session_id' => $request->session()->getId(),
                        'is_returning_user' => $request->cookie('maharat_session') ? 'yes' : 'no',
                    ]);
                    
                    // For returning users, ensure session is fully restored before loading permissions
                    if ($request->cookie('maharat_session') && $request->cookie('maharat_session') !== $request->session()->getId()) {
                        \Log::info('⏳ Session restoration in progress, delaying permission loading', [
                            'user_id' => $user->id,
                            'cookie_session' => $request->cookie('maharat_session'),
                            'current_session' => $request->session()->getId(),
                        ]);
                        
                        // Return basic user data without permissions for now
                        // The next request will have the restored session and can load permissions
                        $userData = [
                            'id' => $user->id,
                            'name' => $user->name,
                            'email' => $user->email,
                            'email_verified_at' => $user->email_verified_at,
                            'created_at' => $user->created_at,
                            'updated_at' => $user->updated_at,
                            'roles' => [],
                            'permissions' => []
                        ];
                        
                        \Log::info('✅ Basic user data returned, permissions will load on next request', [
                            'user_id' => $user->id,
                        ]);
                        
                        return [
                            ...parent::share($request),
                            'auth' => [
                                'user' => $userData,
                            ],
                        ];
                    }
                    
                    // Normal permission loading for fresh sessions
                    $roles = $user->roles()->pluck('name')->toArray();
                    $permissions = $user->getAllPermissions()->pluck('name')->toArray();
                    
                    \Log::info('✅ User permissions loaded successfully', [
                        'user_id' => $user->id,
                        'roles_count' => count($roles),
                        'permissions_count' => count($permissions),
                        'has_view_requests' => in_array('view_requests', $permissions),
                        'roles' => $roles,
                        'permissions' => $permissions,
                    ]);
                    
                    // Create clean user data array
                    $userData = [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'email_verified_at' => $user->email_verified_at,
                        'created_at' => $user->created_at,
                        'updated_at' => $user->updated_at,
                        'roles' => $roles,
                        'permissions' => $permissions
                    ];
                } catch (\Exception $userError) {
                    \Log::error('🔴 CRITICAL: Error loading user permissions - This causes 500 error!', [
                        'user_id' => $request->user()?->id,
                        'user_email' => $request->user()?->email,
                        'session_id' => $request->session()->getId(),
                        'error' => $userError->getMessage(),
                        'error_file' => $userError->getFile(),
                        'error_line' => $userError->getLine(),
                        'error_trace' => $userError->getTraceAsString(),
                        'likely_cause' => 'Permission/Role relationship issue for returning users',
                    ]);
                    
                    // Fallback to basic user data only
                    $userData = [
                        'id' => $request->user()->id,
                        'name' => $request->user()->name,
                        'email' => $request->user()->email,
                        'roles' => [],
                        'permissions' => []
                    ];
                }
            }

            return [
                ...parent::share($request),
                'auth' => [
                    'user' => $userData,
                ],
            ];
        } catch (\Exception $e) {
            \Log::error('🔴 INERTIA MIDDLEWARE FATAL ERROR - This is the 500 error source!', [
                'error_message' => $e->getMessage(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'error_class' => get_class($e),
                'user_id' => $request->user()?->id,
                'session_id' => $request->hasSession() ? $request->session()->getId() : 'NO_SESSION',
                'url' => $request->url(),
                'error_trace' => $e->getTraceAsString(),
                'SOLUTION' => 'This is likely a permission/role loading issue for returning users',
            ]);
            \Log::error('Inertia Middleware Error', [
                'url' => $request->url(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Return minimal data to prevent complete failure
            return [
                ...parent::share($request),
                'auth' => [
                    'user' => null,
                ],
            ];
        }
    }
}
