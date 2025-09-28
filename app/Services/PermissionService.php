<?php

namespace App\Services;

use Illuminate\Support\Facades\Auth;

class PermissionService
{
    /**
     * Check if user has permission for a specific feature
     */
    public static function hasPermission($permission)
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        return $user->hasPermissionTo($permission);
    }

    /**
     * Check if user has any of the given permissions
     */
    public static function hasAnyPermission(array $permissions)
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        foreach ($permissions as $permission) {
            if ($user->hasPermissionTo($permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user has all of the given permissions
     */
    public static function hasAllPermissions(array $permissions)
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }

        foreach ($permissions as $permission) {
            if (!$user->hasPermissionTo($permission)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get user's permissions as an array
     */
    public static function getUserPermissions()
    {
        $user = Auth::user();
        if (!$user) {
            return [];
        }

        return $user->getAllPermissions()->pluck('name')->toArray();
    }

    /**
     * Check if feature should be visible based on permission
     */
    public static function isFeatureVisible($permission)
    {
        return self::hasPermission($permission);
    }

    /**
     * Get permission mapping for frontend
     */
    public static function getPermissionMap()
    {
        return [
            'requests' => [
                'request_new_item',
                'make_new_request'
            ],
            'task_center' => [
                'task_center'
            ],
            'procurement' => [
                'rfqs',
                'quotations',
                'purchase_order',
                'external_invoices'
            ],
            'finance' => [
                'maharat_invoice',
                'accounts',
                'payment_order',
                'account_receivable',
                'account_payables'
            ],
            'warehouse' => [
                'user_material_requests',
                'categories',
                'items',
                'good_receiving_notes',
                'inventory_tracking'
            ],
            'budget' => [
                'cost_centers',
                'income_statement',
                'balance_sheet',
                'budget',
                'request_budget'
            ],
            'statuses' => [
                'view_material_request_status',
                'view_rfq_status',
                'view_purchase_order_status',
                'view_payment_order_status',
                'view_invoice_status',
                'view_budget_request_status',
                'total_budget_request'
            ],
            'configuration' => [
                'organizational_chart',
                'process_flow',
                'notification_settings',
                'roles_permissions'
            ],
            'sidebar' => [
                'sidebar_notification',
                'profile_settings',
                'user_manual',
                'faqs'
            ]
        ];
    }
}
