<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Run the document permissions seeder
        $this->call(DocumentPermissionSeeder::class);

        // Create permissions
        $permissions = [
            // Dashboard permissions
            'view_requests',
            'create_requests',
            'edit_requests',
            'delete_requests',
            'approve_requests',
            'view_tasks',
            'create_tasks',
            'assign_tasks',
            'view_procurement',
            'manage_procurement',
            'view_rfqs',
            'create_rfqs',
            'approve_rfqs',
            'view_purchase_orders',
            'create_purchase_orders',
            'approve_purchase_orders',
            'view_finance',
            'manage_finance',
            'view_maharat_invoices',
            'create_maharat_invoices',
            'view_warehouse',
            'manage_warehouse',
            'stock_in',
            'stock_out',
            'view_budget',
            'manage_budget',
            'approve_budget',
            'view_reports',
            'create_reports',
            'export_reports',
            'view_configuration',
            'view_faqs',
            'create_faqs',
            'edit_faqs',
            'delete_faqs',
            'approve_faqs',
            'view_user_manual',
            'create_user_manual',
            'edit_user_manual',
            'delete_user_manual',
            'approve_user_manual',
            'manage_settings',
            'view_process_flow',
            'view_permission_settings',
            'view_company_settings',
            'view_department_settings',
            'view_branch_settings',
            'view_currency_settings',
            'view_designation_settings',
            'view_employee_settings',
            'view_employee_type_settings',
            'view_employee_status_settings',
            'view_employee_category_settings',
            'view_employee_grade_settings',
            'view_employee_band_settings',
            'view_employee_level_settings',
            'view_employee_position_settings',
            'view_employee_role_settings',
            'view_employee_permission_settings',
            'view_employee_designation_settings',
            'view_employee_department_settings',
            'view_employee_branch_settings',
            'view_employee_company_settings',
            'view_employee_currency_settings',
            'view_org_chart',
            'edit_org_chart',
            'view_dashboard',
            'edit_profile',
            'view_notifications',
            'manage_notifications',
            'view_statuses'
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Get all permissions including document permissions
        $allPermissions = Permission::all();

        // Helper function to update or create role
        $updateOrCreateRole = function($name, $parentId, $permissions) {
            // Convert permissions to array of names if it's a collection
            if ($permissions instanceof \Illuminate\Database\Eloquent\Collection) {
                $permissions = $permissions->pluck('name')->toArray();
            }
            
            // Ensure view permissions exist for ALL roles
            $basePermissions = [
                'view_faqs',
                'view_user_manual',
                'view_process_flow'
            ];
            
            foreach ($basePermissions as $perm) {
                if (!in_array($perm, $permissions)) {
                    $permissions[] = $perm;
                }
            }
            
            // Add configuration center permissions only for directors and admin
            if ($name === 'Admin' || $name === 'Managing Director' || $name === 'Department Director') {
                $configPermissions = [
                    'view_configuration',
                    'view_org_chart',
                    'view_permission_settings',
                    'view_company_settings',
                    'view_department_settings',
                    'view_branch_settings',
                    'view_currency_settings',
                    'view_designation_settings',
                    'view_employee_settings',
                    'view_employee_type_settings',
                    'view_employee_status_settings',
                    'view_employee_category_settings',
                    'view_employee_grade_settings',
                    'view_employee_band_settings',
                    'view_employee_level_settings',
                    'view_employee_position_settings',
                    'view_employee_role_settings',
                    'view_employee_permission_settings',
                    'view_employee_designation_settings',
                    'view_employee_department_settings',
                    'view_employee_branch_settings',
                    'view_employee_company_settings',
                    'view_employee_currency_settings',
                    'view_notifications',
                    'manage_notifications',
                    'view_statuses'
                ];
                
                foreach ($configPermissions as $perm) {
                    if (!in_array($perm, $permissions)) {
                        $permissions[] = $perm;
                    }
                }
            }

            // Add notification permissions for users with warehouse access
            if (in_array('view_warehouse', $permissions)) {
                if (!in_array('view_notifications', $permissions)) {
                    $permissions[] = 'view_notifications';
                }
            }
            
            // Add CRUD permissions for directors and admin
            if ($name === 'Admin' || $name === 'Managing Director' || $name === 'Department Director') {
                foreach ([
                    'create_faqs', 'edit_faqs', 'delete_faqs',
                    'create_user_manual', 'edit_user_manual', 'delete_user_manual', 'approve_user_manual',
                ] as $perm) {
                    if (!in_array($perm, $permissions)) {
                        $permissions[] = $perm;
                    }
                }
            }
            
            // Create/update role (without parent_id)
            $role = Role::updateOrCreate(
                ['name' => $name]
            );
            
            // Sync permissions
            $role->syncPermissions($permissions);
            return $role;
        };

        // Admin/CEO - has all permissions
        $adminRole = $updateOrCreateRole('Admin', null, $allPermissions);

        // Managing Director
        $managingDirectorRole = $updateOrCreateRole('Managing Director', $adminRole->id, [
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
            'view_process_flow',
            'view_permission_settings',
            'view_faqs', 'create_faqs', 'edit_faqs', 'delete_faqs', 'approve_faqs',
            'view_user_manual', 'create_user_manual', 'edit_user_manual', 'delete_user_manual', 'approve_user_manual',
            'view_notifications', 'manage_notifications',
            'view_configuration',
            'view_org_chart',
            'view_company_settings',
            'view_department_settings',
            'view_branch_settings',
            'view_currency_settings',
            'view_designation_settings',
            'view_employee_settings',
            'view_employee_type_settings',
            'view_employee_status_settings',
            'view_employee_category_settings',
            'view_employee_grade_settings',
            'view_employee_band_settings',
            'view_employee_level_settings',
            'view_employee_position_settings',
            'view_employee_role_settings',
            'view_employee_permission_settings',
            'view_employee_designation_settings',
            'view_employee_department_settings',
            'view_employee_branch_settings',
            'view_employee_company_settings',
            'view_employee_currency_settings',
            'view_statuses'
        ]);

        // Department Director
        $departmentDirectorRole = $updateOrCreateRole('Department Director', $managingDirectorRole->id, [
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
            'view_process_flow',
            'view_permission_settings',
            'view_faqs', 'create_faqs', 'edit_faqs', 'delete_faqs', 'approve_faqs',
            'view_user_manual', 'create_user_manual', 'edit_user_manual', 'delete_user_manual', 'approve_user_manual',
            'view_notifications', 'manage_notifications',
            'view_configuration',
            'view_org_chart',
            'view_company_settings',
            'view_department_settings',
            'view_branch_settings',
            'view_currency_settings',
            'view_designation_settings',
            'view_employee_settings',
            'view_employee_type_settings',
            'view_employee_status_settings',
            'view_employee_category_settings',
            'view_employee_grade_settings',
            'view_employee_band_settings',
            'view_employee_level_settings',
            'view_employee_position_settings',
            'view_employee_role_settings',
            'view_employee_permission_settings',
            'view_employee_designation_settings',
            'view_employee_department_settings',
            'view_employee_branch_settings',
            'view_employee_company_settings',
            'view_employee_currency_settings',
            'view_statuses'
        ]);

        // Secretary role with limited view permissions
        $secretaryRole = $updateOrCreateRole('Secretary', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Base User role with common permissions (view only)
        $userRole = $updateOrCreateRole('User', $departmentDirectorRole->id, [
            'view_dashboard',
            'edit_profile',
            'view_requests',
            'create_requests',
            'edit_requests',
            'view_tasks',
            'view_process_flow',
            'view_faqs',
            'view_user_manual'
        ]);

        // Graduation Coordinator
        $updateOrCreateRole('Graduation Coordinator', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Social Media Specialist
        $updateOrCreateRole('Social Media Specialist', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Marketing Specialist
        $updateOrCreateRole('Marketing Specialist', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Internal Audit
        $updateOrCreateRole('Internal Audit', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Project Management Officer
        $updateOrCreateRole('Project Management Officer', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Admin & Support Supervisor
        $updateOrCreateRole('Admin & Support Supervisor', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Messenger
        $updateOrCreateRole('Messenger', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // QA Site Representative
        $updateOrCreateRole('QA Site Representative', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // LTP Site Representative
        $updateOrCreateRole('LTP Site Representative', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Accountant
        $updateOrCreateRole('Accountant', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_process_flow', 'view_faqs', 'view_user_manual',
            'view_finance', 'manage_finance',
            'view_maharat_invoices', 'create_maharat_invoices',
            'view_budget', 'manage_budget',
            'view_reports', 'create_reports', 'export_reports',
            'manage_settings',
            'view_warehouse', 'manage_warehouse',
            'view_procurement', 'manage_procurement',
            'view_notifications'  // Added because they have warehouse access
        ]);

        // Procurement Officer
        $updateOrCreateRole('Procurement Officer', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_process_flow', 'view_faqs', 'view_user_manual',
            'view_procurement', 'manage_procurement',
            'view_rfqs', 'create_rfqs',
            'view_purchase_orders', 'create_purchase_orders',
            'view_warehouse', 'manage_warehouse',
            'stock_in', 'stock_out',
            'view_reports', 'create_reports', 'export_reports',
            'manage_settings',
            'view_notifications',  // Added because they have warehouse access
            'view_finance', 'manage_finance',  // Added for Finance Center access
            'view_budget', 'manage_budget'  // Added for Budget & Accounts access
        ]);

        // Procurement Specialist
        $updateOrCreateRole('Procurement Specialist', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_process_flow', 'view_faqs', 'view_user_manual',
            'view_procurement', 'manage_procurement',
            'view_rfqs', 'create_rfqs',
            'view_purchase_orders', 'create_purchase_orders'
        ]);

        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
