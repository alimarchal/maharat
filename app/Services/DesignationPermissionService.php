<?php

namespace App\Services;

use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class DesignationPermissionService
{
    /**
     * Get the role name for a designation
     */
    public function getRoleForDesignation(string $designation): ?string
    {
        // Map designations to roles
        $designationRoleMap = [
            'Admin' => 'Admin',
            'Managing Director' => 'Managing Director',
            'Department Director' => 'Department Director',
            'Secretary' => 'Secretary',
            'Graduation Coordinator' => 'Graduation Coordinator',
            'Social Media Specialist' => 'Social Media Specialist',
            'Marketing Specialist' => 'Marketing Specialist',
            'Internal Audit' => 'Internal Audit',
            'Project Management Officer' => 'Project Management Officer',
            'Admin & Support Supervisor' => 'Admin & Support Supervisor',
            'Messenger' => 'Messenger',
            'QA Site Representative' => 'QA Site Representative',
            'LTP Site Representative' => 'LTP Site Representative',
            'Accountant' => 'Accountant',
            'Procurement Officer' => 'Procurement Officer',
            'Procurement Specialist' => 'Procurement Specialist'
        ];

        return $designationRoleMap[$designation] ?? 'User';
    }

    /**
     * Get permissions for a designation
     */
    public function getPermissionsForDesignation(string $designation): array
    {
        // Base permissions that all users should have
        $basePermissions = [
            'view_faqs',
            'view_user_manual',
            'view_process_flow'
        ];

        // Configuration center permissions - only for directors
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
            'view_employee_currency_settings'
        ];

        // Map designations to their specific permissions
        $designationPermissions = [
            'Admin' => Permission::all()->pluck('name')->toArray(),
            'Managing Director' => [
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
                'view_statuses'  // Added statuses permission for directors
            ],
            'Department Director' => [
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
                'view_statuses'  // Added statuses permission for directors
            ],
            'Secretary' => [
                'view_dashboard', 'edit_profile',
                'view_requests', 'create_requests', 'edit_requests',
                'view_tasks', 'create_tasks',
                'view_process_flow', 'view_faqs', 'view_user_manual'
            ],
            'Accountant' => [
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
            ],
            'Procurement Officer' => [
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
            ],
            'Procurement Specialist' => [
                'view_dashboard', 'edit_profile',
                'view_requests', 'create_requests', 'edit_requests',
                'view_tasks', 'create_tasks',
                'view_process_flow', 'view_faqs', 'view_user_manual',
                'view_procurement', 'manage_procurement',
                'view_rfqs', 'create_rfqs',
                'view_purchase_orders', 'create_purchase_orders'
            ]
        ];

        // Get specific permissions for the designation
        $specificPermissions = $designationPermissions[$designation] ?? $basePermissions;

        // Add configuration center permissions only for directors
        if (str_contains($designation, 'Director')) {
            $specificPermissions = array_merge($specificPermissions, $configPermissions);
            // Add notification permissions for directors
            if (!in_array('view_notifications', $specificPermissions)) {
                $specificPermissions[] = 'view_notifications';
            }
            if (!in_array('manage_notifications', $specificPermissions)) {
                $specificPermissions[] = 'manage_notifications';
            }
            // Add statuses permission for directors
            if (!in_array('view_statuses', $specificPermissions)) {
                $specificPermissions[] = 'view_statuses';
            }
        }

        // Add notification permissions for users with warehouse access
        if (in_array('view_warehouse', $specificPermissions)) {
            if (!in_array('view_notifications', $specificPermissions)) {
                $specificPermissions[] = 'view_notifications';
            }
        }

        // Merge base permissions with specific permissions
        return array_unique(array_merge($basePermissions, $specificPermissions));
    }

    /**
     * Assign role and permissions to a user based on their designation
     */
    public function assignRoleAndPermissions(User $user): void
    {
        if (!$user->designation) {
            return;
        }

        $designation = $user->designation->designation;
        $roleName = $this->getRoleForDesignation($designation);
        $permissions = $this->getPermissionsForDesignation($designation);

        // Get or create the role
        $role = Role::firstOrCreate(['name' => $roleName]);

        // Assign the role to the user
        $user->syncRoles([$role]);

        // Assign permissions
        $user->syncPermissions($permissions);
    }
} 