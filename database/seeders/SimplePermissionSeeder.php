<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class SimplePermissionSeeder extends Seeder
{
    public function run()
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Main cards and sub-options permissions
        $permissions = [
            // Main Cards
            'requests',
            'task_center',
            'procurement_center',
            'finance_center',
            'warehouse',
            'budget_accounts',
            'statuses',
            'configuration_center',
            'sidebar',
            
            // Requests sub-options
            'request_new_item',
            'make_new_request',
            
            // Procurement Center sub-options
            'rfqs',
            'quotations',
            'purchase_order',
            'external_invoices',
            
            // Finance Center sub-options
            'maharat_invoice',
            'accounts',
            'payment_order',
            'account_receivable',
            'account_payables',
            
            // Warehouse sub-options
            'user_material_requests',
            'categories',
            'items',
            'good_receiving_notes',
            'inventory_tracking',
            'view_categories',
            'view_items',
            'view_inventory_tracking',
            'create_warehouse',
            'create_categories',
            'create_items',
            'create_goods_receiving_notes',
            'add_inventory',
            
            // Budget & Accounts sub-options
            'cost_centers',
            'income_statement',
            'balance_sheet',
            'budget',
            'request_budget',
            
            // Statuses sub-options
            'view_material_request_status',
            'view_rfq_status',
            'view_purchase_order_status',
            'view_payment_order_status',
            'view_invoice_status',
            'view_short_delivery_status',
            'view_budget_request_status',
            'view_budget_reallocation',
            'view_budget_reallocation_status',
            'total_budget_request',
            
            // Configuration Center sub-options
            'organizational_chart',
            'process_flow',
            'notification_settings',
            'roles_permissions',
            
            // Sidebar sub-options
            'sidebar_notification',
            'profile_settings',
            'user_manual',
            'faqs',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web'
            ]);
        }

        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
