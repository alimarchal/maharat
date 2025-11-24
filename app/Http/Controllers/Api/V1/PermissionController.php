<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\UserPermissionOverrideService;

class PermissionController extends Controller
{
    /**
     * Get user's effective permissions (considering both role and user-specific permissions)
     */
    public function getUserEffectivePermissions(Request $request)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Get user's role
        $userRole = $user->roles()->first();
        if (!$userRole) {
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }

        // Get role permissions
        $rolePermissions = $userRole->permissions->pluck('name')->toArray();
        
        // Get user permission overrides
        $userOverrides = UserPermissionOverrideService::getUserOverrides($user);
        
        // Define all possible permissions
        $allPermissions = [
            'view_requests', 'request_new_item', 'make_new_request',
            'view_budget_reallocation', 'view_budget_reallocation_status',
            'view_tasks',
            'view_procurement', 'view_rfqs', 'make_new_rfq', 'view_quotations', 'add_supplier', 'add_new_quotation', 'view_purchase_orders', 'create_new_purchase_order', 'view_invoices', 'add_invoice',
            'view_finance', 'view_maharat_invoices', 'add_customers', 'create_new_invoice', 'view_payment_orders', 'create_payment_order', 'view_account_receivables', 'view_account_payables', 'view_accounts', 'create_new_account',
            'view_warehouse', 'stock_in', 'stock_out', 'view_material_requests', 'view_goods_receiving_notes', 'view_categories', 'view_items', 'view_inventory_tracking', 'create_warehouse', 'create_categories', 'create_items', 'create_goods_receiving_notes', 'add_inventory',
            'view_budget', 'manage_budget', 'approve_budget', 'view_cost_centers', 'view_income_statement', 'view_balance_sheet', 'view_request_budget', 'create_cost_center', 'create_sub_cost_center', 'create_fiscal_year', 'create_budget', 'approve_budget_option', 'create_department_budget_request',
            'view_statuses', 'view_material_request_status', 'view_rfq_status', 'view_purchase_order_status', 'view_payment_order_status', 'view_maharat_invoice_status', 'view_budget_request_status', 'view_total_budget_status', 'view_short_delivery_status',
            'view_faqs', 'create_faqs', 'edit_faqs', 'delete_faqs',
            'view_configuration', 'view_process_flow', 'manage_settings', 'view_org_chart', 'view_permission_settings',
            'view_notifications', 'edit_profile', 'view_user_manual', 'create_user_manual', 'edit_user_manual', 'delete_user_manual', 'modify_user_manual',
            'view_sidebar', 'sidebar_notification',
            'edit_employee', 'add_employee', 'delete_employee'
        ];
        
        // Calculate effective permissions
        $effectivePermissions = [];
        foreach ($allPermissions as $permission) {
            $hasRolePermission = in_array($permission, $rolePermissions);
            $hasUserOverride = isset($userOverrides[$permission]);
            
            // If user has override, use user's setting; otherwise use role permission
            $effectivePermission = $hasUserOverride ? $userOverrides[$permission] : $hasRolePermission;
            
            if ($effectivePermission) {
                $effectivePermissions[] = $permission;
            }
        }
        
        return response()->json([
            'success' => true,
            'data' => $effectivePermissions
        ]);
    }

    /**
     * Check if user has specific permission
     */
    public function checkPermission(Request $request, $permission)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $hasPermission = $user->hasPermissionTo($permission);
        
        return response()->json([
            'success' => true,
            'has_permission' => $hasPermission
        ]);
    }

    /**
     * Get user's permission structure for frontend
     */
    public function getUserPermissionStructure(Request $request)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // Get user's role
        $userRole = $user->roles()->first();
        if (!$userRole) {
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }

        // Get role permissions
        $rolePermissions = $userRole->permissions->pluck('name')->toArray();
        
        // Get user permission overrides
        $userOverrides = UserPermissionOverrideService::getUserOverrides($user);
        
        // Helper function to check effective permission
        $hasEffectivePermission = function($permission) use ($rolePermissions, $userOverrides) {
            $hasRolePermission = in_array($permission, $rolePermissions);
            $hasUserOverride = isset($userOverrides[$permission]);
            return $hasUserOverride ? $userOverrides[$permission] : $hasRolePermission;
        };
        
        // Define the permission structure
        $permissionStructure = [
            'requests' => [
                'enabled' => $hasEffectivePermission('view_requests'),
                'subOptions' => [
                    'request_new_item' => $hasEffectivePermission('request_new_item'),
                    'make_new_request' => $hasEffectivePermission('make_new_request'),
                ]
            ],
            'task_center' => [
                'enabled' => $hasEffectivePermission('view_tasks'),
                'subOptions' => []
            ],
            'procurement_center' => [
                'enabled' => $hasEffectivePermission('view_procurement'),
                'subOptions' => [
                    'rfqs' => [
                        'enabled' => $hasEffectivePermission('view_rfqs'),
                        'subOptions' => [
                            'make_new_rfq' => $hasEffectivePermission('make_new_rfq'),
                        ]
                    ],
                    'quotations' => [
                        'enabled' => $hasEffectivePermission('view_quotations'),
                        'subOptions' => [
                            'add_supplier' => $hasEffectivePermission('add_supplier'),
                            'add_new_quotation' => $hasEffectivePermission('add_new_quotation'),
                        ]
                    ],
                    'purchase_orders' => [
                        'enabled' => $hasEffectivePermission('view_purchase_orders'),
                        'subOptions' => [
                            'create_new_purchase_order' => $hasEffectivePermission('create_new_purchase_order'),
                        ]
                    ],
                    'external_invoices' => [
                        'enabled' => $hasEffectivePermission('view_invoices'),
                        'subOptions' => [
                            'add_invoice' => $hasEffectivePermission('add_invoice'),
                        ]
                    ],
                ]
            ],
            'finance_center' => [
                'enabled' => $hasEffectivePermission('view_finance'),
                'subOptions' => [
                    'maharat_invoices' => [
                        'enabled' => $hasEffectivePermission('view_maharat_invoices'),
                        'subOptions' => [
                            'add_customers' => $hasEffectivePermission('add_customers'),
                            'create_new_invoice' => $hasEffectivePermission('create_new_invoice'),
                        ]
                    ],
                    'accounts' => [
                        'enabled' => $hasEffectivePermission('view_accounts'),
                        'subOptions' => [
                            'create_new_account' => $hasEffectivePermission('create_new_account'),
                        ]
                    ],
                    'payment_orders' => [
                        'enabled' => $hasEffectivePermission('view_payment_orders'),
                        'subOptions' => [
                            'create_payment_order' => $hasEffectivePermission('create_payment_order'),
                        ]
                    ],
                    'account_receivables' => $hasEffectivePermission('view_account_receivables'),
                    'account_payables' => $hasEffectivePermission('view_account_payables'),
                ]
            ],
            'warehouse' => [
                'enabled' => $hasEffectivePermission('view_warehouse'),
                'subOptions' => [
                    'user_material_requests' => $hasEffectivePermission('view_material_requests'),
                    'categories' => [
                        'enabled' => $hasEffectivePermission('view_categories'),
                        'subOptions' => [
                            'create_new_category' => $hasEffectivePermission('create_categories'),
                        ]
                    ],
                    'items' => [
                        'enabled' => $hasEffectivePermission('view_items'),
                        'subOptions' => [
                            'create_new_item' => $hasEffectivePermission('create_items'),
                        ]
                    ],
                    'goods_receiving_notes' => [
                        'enabled' => $hasEffectivePermission('view_goods_receiving_notes'),
                        'subOptions' => [
                            'create_good_receiving_notes' => $hasEffectivePermission('create_goods_receiving_notes'),
                        ]
                    ],
                    'inventory_tracking' => [
                        'enabled' => $hasEffectivePermission('view_inventory_tracking'),
                        'subOptions' => [
                            'add_inventory' => $hasEffectivePermission('add_inventory'),
                        ]
                    ],
                    'create_warehouse' => $hasEffectivePermission('create_warehouse'),
                ]
            ],
            'budget_accounts' => [
                'enabled' => $hasEffectivePermission('view_budget'),
                'subOptions' => [
                    'cost_centers' => [
                        'enabled' => $hasEffectivePermission('view_cost_centers'),
                        'subOptions' => [
                            'create_cost_center' => $hasEffectivePermission('create_cost_center'),
                            'create_sub_cost_center' => $hasEffectivePermission('create_sub_cost_center'),
                        ]
                    ],
                    'income_statement' => $hasEffectivePermission('view_income_statement'),
                    'balance_sheet' => $hasEffectivePermission('view_balance_sheet'),
                    'budget' => [
                        'enabled' => $hasEffectivePermission('manage_budget'),
                        'subOptions' => [
                            'create_fiscal_year' => $hasEffectivePermission('create_fiscal_year'),
                            'create_budget' => $hasEffectivePermission('create_budget'),
                            'approve_budget' => $hasEffectivePermission('approve_budget_option'),
                        ]
                    ],
                    'request_budget' => [
                        'enabled' => $hasEffectivePermission('view_request_budget'),
                        'subOptions' => [
                            'create_department_budget_request' => $hasEffectivePermission('create_department_budget_request'),
                            'view_budget_reallocation' => $hasEffectivePermission('view_budget_reallocation'),
                        ]
                    ],
                ]
            ],
            'status' => [
                'enabled' => $hasEffectivePermission('view_statuses'),
                'subOptions' => [
                    'material_request_status' => $hasEffectivePermission('view_material_request_status'),
                    'rfq_status' => $hasEffectivePermission('view_rfq_status'),
                    'purchase_order_status' => $hasEffectivePermission('view_purchase_order_status'),
                    'payment_order_status' => $hasEffectivePermission('view_payment_order_status'),
                    'maharat_invoice_status' => $hasEffectivePermission('view_maharat_invoice_status'),
                    'budget_request_status' => $hasEffectivePermission('view_budget_request_status'),
                    'budget_reallocation_status' => $hasEffectivePermission('view_budget_reallocation_status'),
                    'total_budget_status' => $hasEffectivePermission('view_total_budget_status'),
                    'short_delivery_status' => $hasEffectivePermission('view_short_delivery_status'),
                ]
            ],
            'reports' => [
                'enabled' => $hasEffectivePermission('view_reports'),
                'subOptions' => [
                    'create_reports' => $hasEffectivePermission('create_reports'),
                    'export_reports' => $hasEffectivePermission('export_reports'),
                ]
            ],
            'configuration_center' => [
                'enabled' => $hasEffectivePermission('view_configuration'),
                'subOptions' => [
                    'organizational_chart' => [
                        'enabled' => $hasEffectivePermission('view_org_chart'),
                        'subOptions' => [
                            'edit_employee' => $hasEffectivePermission('edit_employee'),
                            'add_employee' => $hasEffectivePermission('add_employee'),
                            'delete_employee' => $hasEffectivePermission('delete_employee'),
                        ]
                    ],
                    'process_flow' => $hasEffectivePermission('view_process_flow'),
                    'notification_settings' => $hasEffectivePermission('manage_settings'),
                    'roles_permissions' => $hasEffectivePermission('view_permission_settings'),
                ]
            ],
            'sidebar' => [
                'enabled' => $hasEffectivePermission('view_notifications') || $hasEffectivePermission('edit_profile') || $hasEffectivePermission('view_user_manual') || $hasEffectivePermission('view_faqs'),
                'subOptions' => [
                    'notification_settings' => $hasEffectivePermission('view_notifications'),
                    'profile_settings' => $hasEffectivePermission('edit_profile'),
                    'user_manual' => [
                        'enabled' => $hasEffectivePermission('view_user_manual'),
                        'subOptions' => [
                            'modify_manual' => $hasEffectivePermission('modify_user_manual'),
                        ]
                    ],
                    'faqs' => [
                        'enabled' => $hasEffectivePermission('view_faqs'),
                        'subOptions' => [
                            'add_faq' => $hasEffectivePermission('create_faqs'),
                            'edit_faq' => $hasEffectivePermission('edit_faqs'),
                            'delete_faq' => $hasEffectivePermission('delete_faqs'),
                        ]
                    ],
                ]
            ]
        ];
        
        return response()->json([
            'success' => true,
            'data' => $permissionStructure
        ]);
    }
}