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
            // Safely get user data without complex relationships
            $userData = null;
            if ($request->user()) {
                try {
                    // Get basic user data
                    $user = $request->user();
                    
                    // Convert roles and permissions to simple arrays
                    $roles = $user->roles()->pluck('name')->toArray();
                    $permissions = $user->getAllPermissions()->pluck('name')->toArray();
                    
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
                    \Log::error('Error loading user data in Inertia', [
                        'user_id' => $request->user()?->id,
                        'error' => $userError->getMessage()
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
