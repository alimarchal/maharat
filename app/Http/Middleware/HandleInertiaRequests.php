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
            // Log the request details
            \Log::info('Inertia Request', [
                'url' => $request->url(),
                'method' => $request->method(),
                'user_id' => $request->user()?->id,
                'route_name' => $request->route()?->getName(),
            ]);

            return [
                ...parent::share($request),
                'auth' => [
                    'user' => $request->user() ? array_merge(
                        $request->user()->toArray(),
                        [
                            'roles' => $request->user()->roles->pluck('name'),
                            'permissions' => $request->user()->getAllPermissions()->pluck('name')
                        ]
                    ) : null,
                ],
            ];
        } catch (\Exception $e) {
            \Log::error('Inertia Middleware Error', [
                'url' => $request->url(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
}
