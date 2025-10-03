<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserPermissionOverride;
use Spatie\Permission\Models\Permission;

class UserPermissionOverrideService
{
    /**
     * Set a user permission override
     */
    public static function setOverride(User $user, string $permissionName, bool $isEnabled): void
    {
        // Ensure permission exists
        Permission::firstOrCreate(
            ['name' => $permissionName],
            ['guard_name' => 'web']
        );

        // Create or update the override
        UserPermissionOverride::updateOrCreate(
            [
                'user_id' => $user->id,
                'permission_name' => $permissionName
            ],
            [
                'is_enabled' => $isEnabled,
                'overrides_role' => true
            ]
        );

        // DO NOT update Spatie permissions directly - let the override system handle it
        // This prevents conflicts between role permissions and user overrides
    }

    /**
     * Get user's effective permission (considering overrides)
     */
    public static function getEffectivePermission(User $user, string $permissionName): bool
    {
        // Check if user has an override for this permission
        $override = UserPermissionOverride::where('user_id', $user->id)
            ->where('permission_name', $permissionName)
            ->first();

        if ($override) {
            return $override->is_enabled;
        }

        // No override, check role permissions
        return $user->hasPermissionTo($permissionName);
    }

    /**
     * Get all user permission overrides
     */
    public static function getUserOverrides(User $user): array
    {
        return UserPermissionOverride::where('user_id', $user->id)
            ->get()
            ->pluck('is_enabled', 'permission_name')
            ->toArray();
    }

    /**
     * Check if user has an override for a specific permission
     */
    public static function hasOverride(User $user, string $permissionName): bool
    {
        return UserPermissionOverride::where('user_id', $user->id)
            ->where('permission_name', $permissionName)
            ->exists();
    }

    /**
     * Remove a user permission override
     */
    public static function removeOverride(User $user, string $permissionName): void
    {
        UserPermissionOverride::where('user_id', $user->id)
            ->where('permission_name', $permissionName)
            ->delete();

        // DO NOT revoke Spatie permissions - let the role permissions take over
        // This allows the user to fall back to their designation's permissions
    }

    /**
     * Clean up redundant overrides that match role permissions
     */
    public static function cleanupRedundantOverrides(User $user): int
    {
        // Get user's role permissions
        $userRole = $user->roles()->first();
        if (!$userRole) {
            return 0;
        }
        
        $rolePermissions = $userRole->permissions->pluck('name')->toArray();
        
        // Get all user overrides
        $overrides = UserPermissionOverride::where('user_id', $user->id)->get();
        
        $removedCount = 0;
        foreach ($overrides as $override) {
            $hasRolePermission = in_array($override->permission_name, $rolePermissions);
            
            // If override matches role permission, remove it (it's redundant)
            if ($override->is_enabled === $hasRolePermission) {
                $override->delete();
                $removedCount++;
            }
        }
        
        return $removedCount;
    }
}
