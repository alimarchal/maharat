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

        // Update the actual Spatie permission
        if ($isEnabled) {
            $user->givePermissionTo($permissionName);
        } else {
            $user->revokePermissionTo($permissionName);
        }
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

        // Also remove from Spatie permissions
        $user->revokePermissionTo($permissionName);
    }
}
