<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Blade;
use App\Services\PermissionService;

class PermissionServiceProvider extends ServiceProvider
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
        // Blade directive for checking permissions
        Blade::directive('hasPermission', function ($permission) {
            return "<?php if (App\Services\PermissionService::hasPermission($permission)): ?>";
        });

        Blade::directive('endHasPermission', function () {
            return "<?php endif; ?>";
        });

        Blade::directive('hasAnyPermission', function ($permissions) {
            return "<?php if (App\Services\PermissionService::hasAnyPermission($permissions)): ?>";
        });

        Blade::directive('endHasAnyPermission', function () {
            return "<?php endif; ?>";
        });

        Blade::directive('hasAllPermissions', function ($permissions) {
            return "<?php if (App\Services\PermissionService::hasAllPermissions($permissions)): ?>";
        });

        Blade::directive('endHasAllPermissions', function () {
            return "<?php endif; ?>";
        });

        Blade::directive('isFeatureVisible', function ($permission) {
            return "<?php if (App\Services\PermissionService::isFeatureVisible($permission)): ?>";
        });

        Blade::directive('endIsFeatureVisible', function () {
            return "<?php endif; ?>";
        });
    }
}
