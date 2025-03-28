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

        // Create Permissions - All permissions from the matrix
        $permissions = [
            // User & Roles Management
            'view_users', 'create_users', 'edit_users', 'delete_users',
            'view_roles', 'create_roles', 'edit_roles', 'delete_roles',

            // General Access
            'view_dashboard', 'edit_profile', 'manage_settings',

            // Requests Module
            'view_requests', 'create_requests', 'edit_requests', 'delete_requests',
            'approve_requests', 'view_material_requests', 'create_material_requests',

            // Task Center
            'view_tasks', 'create_tasks', 'assign_tasks',

            // Procurement Center
            'view_procurement', 'manage_procurement',
            'view_rfqs', 'create_rfqs', 'approve_rfqs',
            'view_purchase_orders', 'create_purchase_orders', 'approve_purchase_orders',

            // Finance Center
            'view_finance', 'manage_finance',
            'view_maharat_invoices', 'create_maharat_invoices',

            // Warehouse
            'view_warehouse', 'manage_warehouse',
            'stock_in', 'stock_out',

            // Budget & Accounts
            'view_budget', 'manage_budget', 'approve_budget',

            // Reports & Statuses
            'view_reports', 'create_reports', 'export_reports',

            // Configuration Center
            'view_configuration', 'manage_configuration',
            'view_org_chart', 'edit_org_chart',
            'view_process_flow', 'edit_process_flow',
            'view_permission_settings', 'edit_permission_settings'
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Admin/CEO - has all permissions
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
        $directorPermissions = [
            'view_users', 'create_users', 'edit_users',
            'view_roles',
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests', 'delete_requests', 'approve_requests',
            'view_tasks', 'create_tasks', 'assign_tasks',
            'view_procurement', 'manage_procurement',
            'view_rfqs', 'create_rfqs', 'approve_rfqs',
            'view_purchase_orders', 'create_purchase_orders', 'approve_purchase_orders',
            'view_finance', 'manage_finance',
            'view_maharat_invoices', 'create_maharat_invoices',
            'view_warehouse', 'manage_warehouse',
            'stock_in', 'stock_out',
            'view_budget', 'manage_budget', 'approve_budget',
            'view_reports', 'create_reports', 'export_reports',
            'view_configuration',
            'view_org_chart', 'edit_org_chart',
            'view_process_flow',
            'view_permission_settings'
        ];
        $directorRole->givePermissionTo($directorPermissions);

        // Manager
        $managerRole = Role::firstOrCreate([
            'name' => 'Manager',
            'guard_name' => 'web',
            'parent_role_id' => $directorRole->id
        ]);
        $managerPermissions = [
            'view_users',
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests', 'delete_requests', 'approve_requests',
            'view_tasks', 'create_tasks', 'assign_tasks',
            'view_procurement',
            'view_rfqs', 'create_rfqs',
            'view_purchase_orders', 'create_purchase_orders',
            'view_finance',
            'view_maharat_invoices', 'create_maharat_invoices',
            'view_warehouse',
            'stock_in', 'stock_out',
            'view_budget',
            'view_reports', 'create_reports',
            'view_org_chart',
            'view_process_flow'
        ];
        $managerRole->givePermissionTo($managerPermissions);

        // Supervisor
        $supervisorRole = Role::firstOrCreate([
            'name' => 'Supervisor',
            'guard_name' => 'web',
            'parent_role_id' => $managerRole->id
        ]);
        $supervisorPermissions = [
            'view_users',
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests', 'approve_requests',
            'view_tasks', 'create_tasks', 'assign_tasks',
            'view_procurement',
            'view_rfqs',
            'view_purchase_orders',
            'view_warehouse',
            'view_budget',
            'view_reports',
            'view_org_chart',
            'view_process_flow'
        ];
        $supervisorRole->givePermissionTo($supervisorPermissions);

        // User
        $userRole = Role::firstOrCreate([
            'name' => 'User',
            'guard_name' => 'web',
            'parent_role_id' => $supervisorRole->id
        ]);
        $userPermissions = [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks',
            'view_org_chart',
            'view_process_flow'
        ];
        $userRole->givePermissionTo($userPermissions);

        // Procurement Officer
        $procurementOfficer = Role::firstOrCreate([
            'name' => 'Procurement Officer',
            'guard_name' => 'web'
        ]);
        $procurementOfficerPermissions = [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks',
            'view_procurement',
            'view_rfqs', 'create_rfqs',
            'view_purchase_orders', 'create_purchase_orders',
            'view_warehouse',
            'view_org_chart',
            'view_process_flow'
        ];
        $procurementOfficer->givePermissionTo($procurementOfficerPermissions);

        // Procurement Supervisor
        $procurementSupervisor = Role::firstOrCreate([
            'name' => 'Procurement Supervisor',
            'guard_name' => 'web'
        ]);
        $procurementSupervisorPermissions = [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests', 'delete_requests', 'approve_requests',
            'view_tasks', 'create_tasks', 'assign_tasks',
            'view_procurement', 'manage_procurement',
            'view_rfqs', 'create_rfqs', 'approve_rfqs',
            'view_purchase_orders', 'create_purchase_orders', 'approve_purchase_orders',
            'view_maharat_invoices',
            'view_budget',
            'view_warehouse',
            'view_org_chart',
            'view_process_flow'
        ];
        $procurementSupervisor->givePermissionTo($procurementSupervisorPermissions);

        // Warehouse Manager
        $warehouseManager = Role::firstOrCreate([
            'name' => 'Warehouse Manager',
            'guard_name' => 'web'
        ]);
        $warehouseManagerPermissions = [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests', 'approve_requests',
            'view_tasks', 'create_tasks', 'assign_tasks',
            'view_procurement',
            'view_rfqs',
            'view_purchase_orders',
            'view_warehouse', 'manage_warehouse',
            'stock_in', 'stock_out',
            'view_org_chart',
            'view_process_flow'
        ];
        $warehouseManager->givePermissionTo($warehouseManagerPermissions);

        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
