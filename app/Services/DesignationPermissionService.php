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
                'view_configuration',
                'view_org_chart', 'edit_org_chart',
                'view_process_flow',
                'view_permission_settings',
                'view_faqs', 'create_faqs', 'edit_faqs', 'delete_faqs', 'approve_faqs',
                'view_user_manual', 'create_user_manual', 'edit_user_manual', 'delete_user_manual', 'approve_user_manual'
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
                'view_configuration',
                'view_org_chart', 'edit_org_chart',
                'view_process_flow',
                'view_permission_settings',
                'view_faqs', 'create_faqs', 'edit_faqs', 'delete_faqs', 'approve_faqs',
                'view_user_manual', 'create_user_manual', 'edit_user_manual', 'delete_user_manual', 'approve_user_manual'
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
                'manage_settings'
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
                'manage_settings'
            ],
        ];

        // Get specific permissions for the designation or use base permissions
        $specificPermissions = $designationPermissions[$designation] ?? $basePermissions;

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