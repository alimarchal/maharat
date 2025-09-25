<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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

        // Get all permissions from user's roles
        $rolePermissions = $user->getAllPermissions()->pluck('name')->toArray();
        
        // Get user-specific permissions (overrides)
        $userPermissions = $user->getDirectPermissions()->pluck('name')->toArray();
        
        // Merge role permissions with user-specific permissions
        $effectivePermissions = array_unique(array_merge($rolePermissions, $userPermissions));
        
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

        $permissions = $user->getAllPermissions()->pluck('name')->toArray();
        
        // Define the permission structure
        $permissionStructure = [
            'requests' => [
                'enabled' => in_array('requests', $permissions),
                'subOptions' => [
                    'request_new_item' => in_array('request_new_item', $permissions),
                    'make_new_request' => in_array('make_new_request', $permissions),
                ]
            ],
            'task_center' => [
                'enabled' => in_array('view_tasks', $permissions),
                'subOptions' => []
            ],
            'procurement_center' => [
                'enabled' => in_array('view_procurement', $permissions),
                'subOptions' => [
                    'rfqs' => in_array('view_rfqs', $permissions),
                    'quotations' => [
                        'enabled' => in_array('view_quotations', $permissions),
                        'subOptions' => [
                            'add_supplier' => in_array('add_supplier', $permissions),
                            'add_new_quotation' => in_array('add_new_quotation', $permissions),
                        ]
                    ],
                    'purchase_orders' => in_array('view_purchase_orders', $permissions),
                    'external_invoices' => in_array('view_invoices', $permissions),
                ]
            ],
            'finance_center' => [
                'enabled' => in_array('view_finance', $permissions),
                'subOptions' => [
                    'maharat_invoices' => [
                        'enabled' => in_array('view_maharat_invoices', $permissions),
                        'subOptions' => [
                            'add_customers' => in_array('add_customers', $permissions),
                            'create_new_invoice' => in_array('create_new_invoice', $permissions),
                        ]
                    ],
                    'payment_orders' => in_array('view_payment_orders', $permissions),
                    'account_receivables' => in_array('view_account_receivables', $permissions),
                    'account_payables' => in_array('view_account_payables', $permissions),
                    'accounts' => [
                        'enabled' => in_array('view_accounts', $permissions),
                        'subOptions' => [
                            'create_new_account' => in_array('create_new_account', $permissions),
                        ]
                    ],
                ]
            ],
            'warehouse' => [
                'enabled' => in_array('view_warehouse', $permissions),
                'subOptions' => [
                    'stock_in' => in_array('stock_in', $permissions),
                    'stock_out' => in_array('stock_out', $permissions),
                    'material_requests' => in_array('view_material_requests', $permissions),
                    'goods_receiving_notes' => in_array('view_goods_receiving_notes', $permissions),
                ]
            ],
            'budget_accounts' => [
                'enabled' => in_array('view_budget', $permissions),
                'subOptions' => [
                    'manage_budget' => in_array('manage_budget', $permissions),
                    'approve_budget' => in_array('approve_budget', $permissions),
                ]
            ],
            'reports' => [
                'enabled' => in_array('view_reports', $permissions),
                'subOptions' => [
                    'create_reports' => in_array('create_reports', $permissions),
                    'export_reports' => in_array('export_reports', $permissions),
                ]
            ],
            'configuration_center' => [
                'enabled' => in_array('view_configuration', $permissions),
                'subOptions' => [
                    'process_flow' => in_array('view_process_flow', $permissions),
                    'notification_settings' => in_array('manage_settings', $permissions),
                ]
            ],
            'sidebar' => [
                'enabled' => in_array('view_notifications', $permissions),
                'subOptions' => [
                    'notification' => in_array('view_notifications', $permissions),
                    'profile_settings' => in_array('edit_profile', $permissions),
                    'user_manual' => in_array('view_user_manual', $permissions),
                    'faqs' => in_array('view_faqs', $permissions),
                ]
            ]
        ];
        
        return response()->json([
            'success' => true,
            'data' => $permissionStructure
        ]);
    }
}