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
            'view_tasks',
            'view_procurement',
            'view_finance',
            'view_warehouse',
            'view_budget',
            'view_reports',
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
            'view_employee_employee_type_settings',
            'view_employee_employee_status_settings',
            'view_employee_employee_category_settings',
            'view_employee_employee_grade_settings',
            'view_employee_employee_band_settings',
            'view_employee_employee_level_settings',
            'view_employee_employee_position_settings',
            'view_employee_employee_role_settings',
            'view_employee_employee_permission_settings',
            'view_employee_employee_designation_settings',
            'view_employee_employee_department_settings',
            'view_employee_employee_branch_settings',
            'view_employee_employee_company_settings',
            'view_employee_employee_currency_settings',
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
            
            // Add CRUD permissions for directors, admin, and secretary
            $isDirector = false;
            $users = \App\Models\User::whereHas('designation', function($query) {
                $query->where('name', 'like', '%Director%');
            })->get();
            
            if ($users->isNotEmpty()) {
                $isDirector = true;
            }
            
            if ($isDirector || $name === 'Admin' || $name === 'Managing Director' || $name === 'Department Director' || $name === 'Secretary') {
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
            'view_configuration',
            'view_org_chart', 'edit_org_chart',
            'view_process_flow',
            'view_permission_settings',
            'view_faqs', 'create_faqs', 'edit_faqs', 'delete_faqs', 'approve_faqs',
            'view_user_manual', 'create_user_manual', 'edit_user_manual', 'delete_user_manual', 'approve_user_manual'
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
            'view_configuration',
            'view_org_chart', 'edit_org_chart',
            'view_process_flow',
            'view_permission_settings',
            'view_faqs', 'create_faqs', 'edit_faqs', 'delete_faqs', 'approve_faqs',
            'view_user_manual', 'create_user_manual', 'edit_user_manual', 'delete_user_manual', 'approve_user_manual'
        ]);

        // Secretary role with limited view permissions
        $secretaryRole = $updateOrCreateRole('Secretary', $departmentDirectorRole->id, [
            'view_requests',
            'view_tasks',
            'view_reports',
            'view_configuration',
            'view_faqs',
            'view_user_manual'
        ]);

        // Base User role with common permissions (view only)
        $userRole = $updateOrCreateRole('User', $departmentDirectorRole->id, [
            'view_dashboard',
            'edit_profile',
            'view_requests',
            'create_requests',
            'edit_requests',
            'view_tasks',
            'view_configuration',
            'view_org_chart',
            'view_process_flow',
            'view_faqs',
            'view_user_manual'
        ]);

        // Graduation Coordinator
        $updateOrCreateRole('Graduation Coordinator', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_configuration',
            'view_org_chart',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Social Media Specialist
        $updateOrCreateRole('Social Media Specialist', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_configuration',
            'view_org_chart',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Marketing Specialist
        $updateOrCreateRole('Marketing Specialist', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_configuration',
            'view_org_chart',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Internal Audit
        $updateOrCreateRole('Internal Audit', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_configuration',
            'view_org_chart',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // PMO
        $updateOrCreateRole('PMO', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_configuration',
            'view_org_chart',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // A&S Supervisor
        $updateOrCreateRole('A&S Superviser', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_configuration',
            'view_org_chart',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Messenger
        $updateOrCreateRole('Messenger', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_configuration',
            'view_org_chart',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // HR Specialist
        $updateOrCreateRole('HR Specialist', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_configuration',
            'view_org_chart',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Accountant
        $updateOrCreateRole('Accountant', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_procurement',
            'view_rfqs',
            'view_purchase_orders',
            'view_finance',
            'view_maharat_invoices',
            'view_warehouse',
            'view_budget',
            'view_faqs',
            'view_user_manual'
        ]);

        // Procurement Specialist
        $procurementSpecialistRole = $updateOrCreateRole('Procurement Specialist', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_procurement',
            'view_rfqs', 'create_rfqs',
            'view_purchase_orders', 'create_purchase_orders',
            'view_configuration',
            'view_org_chart',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Procurement Officer
        $updateOrCreateRole('Procurement Officer', $procurementSpecialistRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_procurement',
            'view_rfqs', 'create_rfqs',
            'view_purchase_orders', 'create_purchase_orders',
            'view_finance',
            'view_maharat_invoices',
            'view_warehouse',
            'view_budget',
            'view_faqs',
            'view_user_manual'
        ]);

        // IT Specialist
        $updateOrCreateRole('IT Specilist', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_configuration',
            'view_org_chart',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Academic Training Supervisor
        $updateOrCreateRole('Academic Training Supervisor', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_configuration',
            'view_org_chart',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Vocational Training Supervisor
        $updateOrCreateRole('Vocational Training Supervisor', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_configuration',
            'view_org_chart',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // QA Site Rep
        $updateOrCreateRole('QA Site Rep', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_configuration',
            'view_org_chart',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Vocational Training Coordinator
        $updateOrCreateRole('Vocational Training Coordinaton', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_configuration',
            'view_org_chart',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // LTP Site Rep
        $updateOrCreateRole('LTP Site Rep', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_configuration',
            'view_org_chart',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Assessment Coordinator
        $updateOrCreateRole('Assessment Coordinator', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_configuration',
            'view_org_chart',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // LR Coordinator
        $updateOrCreateRole('LR Coordinator', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_configuration',
            'view_org_chart',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Technical Training Specialist
        $updateOrCreateRole('Technical Training Specialist', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_configuration',
            'view_org_chart',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Trainer
        $updateOrCreateRole('Trainer', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_configuration',
            'view_org_chart',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Registrar
        $updateOrCreateRole('Registrar', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_configuration',
            'view_org_chart',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Admin Clerk
        $updateOrCreateRole('Admin Clerk', $departmentDirectorRole->id, [
            'view_dashboard', 'edit_profile',
            'view_requests', 'create_requests', 'edit_requests',
            'view_tasks', 'create_tasks',
            'view_configuration',
            'view_org_chart',
            'view_process_flow', 'view_faqs', 'view_user_manual'
        ]);

        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
