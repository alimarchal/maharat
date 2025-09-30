<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\CacheService;
use Symfony\Component\HttpFoundation\Response;

class ApiResponseCache
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only cache GET requests
        if ($request->method() !== 'GET') {
            return $next($request);
        }

        // Skip caching for authenticated users on sensitive endpoints
        $sensitiveEndpoints = [
            'api/user',
            'api/permissions',
            'api/roles',
            'api/dashboard',
        ];

        $currentPath = $request->path();
        $isSensitiveEndpoint = false;

        foreach ($sensitiveEndpoints as $endpoint) {
            if (str_starts_with($currentPath, $endpoint)) {
                $isSensitiveEndpoint = true;
                break;
            }
        }

        // Skip caching for sensitive endpoints or authenticated users
        if ($isSensitiveEndpoint || $request->user()) {
            return $next($request);
        }

        // Generate cache key
        $cacheKey = 'api_' . md5($request->fullUrl());
        
        // Try to get cached response
        $cachedResponse = CacheService::getCachedQuery($cacheKey, []);
        
        if ($cachedResponse) {
            return response()->json($cachedResponse)
                ->header('X-Cache', 'HIT')
                ->header('X-Cache-Key', $cacheKey);
        }

        // Process request
        $response = $next($request);

        // Cache successful responses
        if ($response->getStatusCode() === 200) {
            $responseData = json_decode($response->getContent(), true);
            if ($responseData) {
                CacheService::cacheQuery($cacheKey, [], $responseData, 900); // 15 minutes
            }
        }

        return $response->header('X-Cache', 'MISS');
    }
}
