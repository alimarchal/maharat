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
            'view_users', 'create_users', 'edit_users', 'delete_users',
            'view_roles', 'create_roles', 'edit_roles', 'delete_roles',
            'view_reports', 'create_reports', 'export_reports',
            'manage_settings', 'view_dashboard', 'edit_profile'
        ];

        foreach ($permissions as $permission) {
            // Use firstOrCreate to prevent duplicates
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create Roles and Assign Permissions

        // Admin/CEO
        $adminRole = Role::firstOrCreate([
            'name' => 'Admin',
            'guard_name' => 'web',
            'parent_role_id' => null
        ]);
        $adminRole->givePermissionTo(Permission::all());

        // Director
        $directorRole = Role::firstOrCreate([
            'name' => 'Director',
            'guard_name' => 'web',
            'parent_role_id' => $adminRole->id
        ]);
        $directorRole->givePermissionTo([
            'view_users', 'create_users', 'edit_users',
            'view_roles',
            'view_reports', 'create_reports', 'export_reports',
            'view_dashboard', 'edit_profile'
        ]);

        // Manager
        $managerRole = Role::firstOrCreate([
            'name' => 'Manager',
            'guard_name' => 'web',
            'parent_role_id' => $directorRole->id
        ]);
        $managerRole->givePermissionTo([
            'view_users',
            'view_reports', 'create_reports',
            'view_dashboard', 'edit_profile'
        ]);

        // Supervisor
        $supervisorRole = Role::firstOrCreate([
            'name' => 'Supervisor',
            'guard_name' => 'web',
            'parent_role_id' => $managerRole->id
        ]);
        $supervisorRole->givePermissionTo([
            'view_users',
            'view_reports',
            'view_dashboard', 'edit_profile'
        ]);

        // User
        $userRole = Role::firstOrCreate([
            'name' => 'User',
            'guard_name' => 'web',
            'parent_role_id' => $supervisorRole->id
        ]);
        $userRole->givePermissionTo([
            'view_dashboard',
            'edit_profile'
        ]);
    }
}
