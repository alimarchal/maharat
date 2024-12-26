<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create Permissions
        $permissions = [
            // User Management
            'view_users',
            'create_users',
            'edit_users',
            'delete_users',

            // Role Management
            'view_roles',
            'create_roles',
            'edit_roles',
            'delete_roles',

            // Reports
            'view_reports',
            'create_reports',
            'export_reports',

            // Settings
            'manage_settings',

            // Basic permissions
            'view_dashboard',
            'edit_profile'
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Create Roles and Assign Permissions

        // Admin/CEO
        $adminRole = Role::create(['name' => 'Admin']);
        $adminRole->givePermissionTo(Permission::all());

        // Director
        $directorRole = Role::create(['name' => 'Director']);
        $directorRole->givePermissionTo([
            'view_users', 'create_users', 'edit_users',
            'view_roles',
            'view_reports', 'create_reports', 'export_reports',
            'view_dashboard', 'edit_profile'
        ]);

        // Manager
        $managerRole = Role::create(['name' => 'Manager']);
        $managerRole->givePermissionTo([
            'view_users',
            'view_reports', 'create_reports',
            'view_dashboard', 'edit_profile'
        ]);

        // Supervisor
        $supervisorRole = Role::create(['name' => 'Supervisor']);
        $supervisorRole->givePermissionTo([
            'view_users',
            'view_reports',
            'view_dashboard', 'edit_profile'
        ]);

        // Ordinary User
        $userRole = Role::create(['name' => 'User']);
        $userRole->givePermissionTo([
            'view_dashboard',
            'edit_profile'
        ]);
    }
}
