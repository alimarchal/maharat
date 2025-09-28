<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Designation;
use App\Models\NotificationChannel;
use App\Models\NotificationType;
use App\Models\Role;
use App\Models\UserNotificationSetting;
use App\Services\NotificationSettingsService;
use App\Services\UserPermissionOverrideService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\V1\StoreUserRequest;
use App\Http\Requests\V1\UpdateUserRequest;
use App\Http\Resources\V1\UserResource;
use App\Http\Resources\V1\UserCollection;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Permission;
use Storage;
use App\Services\DesignationPermissionService;

class UserController extends Controller
{
    protected $notificationSettingsService;
    protected $designationPermissionService;

    public function __construct(
        NotificationSettingsService $notificationSettingsService,
        DesignationPermissionService $designationPermissionService
    ) {
        $this->notificationSettingsService = $notificationSettingsService;
        $this->designationPermissionService = $designationPermissionService;
    }


    public function index(Request $request)
    {
        $users = User::query()
            ->with(['roles', 'permissions', 'department'])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->sort, function ($query, $sort) use ($request) {
                $direction = $request->order ?? 'asc';
                $query->orderBy($sort, $direction);
            })
            ->paginate($request->per_page ?? 15);

        return new UserCollection($users);

    }

    public function store(StoreUserRequest $request)
    {
        $validated = $request->validated();

        // Set the hashed password
        $validated['password'] = Hash::make($validated['password']);

        // Handle profile photo
        if ($request->hasFile('profile_photo_path')) {
            $file = $request->file('profile_photo_path');
            $path = $file->store('users/profile_photos', 'public');
            $validated['profile_photo_path'] = $path;
        }

        $user = User::create($validated);

        // Assign role and permissions based on designation
        $this->designationPermissionService->assignRoleAndPermissions($user);

        // Setup default notification settings
        $this->notificationSettingsService->setupDefaultSettingsForUser($user);

        return new UserResource($user);
    }


    public function show(User $user)
    {
        return new UserResource($user);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $validated = $request->validated();
        if (empty($validated)) {
            return response()->json(['error' => 'No valid fields to update'], 422);
        }

        // Begin database transaction
        DB::beginTransaction();

        try {
            // Handle profile photo update
            if ($request->hasFile('profile_photo_path')) {
                // Delete old photo if exists
                if ($user->profile_photo_path) {
                    Storage::disk('public')->delete($user->profile_photo_path);
                }
                
                // Store new photo
                $file = $request->file('profile_photo_path');
                $path = $file->store('users/profile_photos', 'public');
                $validated['profile_photo_path'] = $path;
            }

            // Check if designation is being updated
            $isDesignationUpdated = isset($validated['designation_id']) && $validated['designation_id'] !== $user->designation_id;

            // Remove role_id from validated data as we'll handle roles through designation
            unset($validated['role_id']);

            // Update user basic information
            $user->update($validated);

            // If designation was updated, reassign role and permissions
            if ($isDesignationUpdated) {
                $this->designationPermissionService->assignRoleAndPermissions($user);
            }

            DB::commit();

            // Refresh user to include updated relationships
            $user->refresh();

            return new UserResource($user);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Error updating user: " . $e->getMessage());
            return response()->json(['error' => 'Failed to update user'], 500);
        }
    }


    public function destroy(User $user)
    {
        try {
            DB::beginTransaction();
            
            // Check if user has any subordinates
            if ($user->children()->exists()) {
                return response()->json([
                    'error' => 'Cannot delete user with subordinates. Please reassign or delete subordinates first.'
                ], 422);
            }

            // Update all references to this user to null
            DB::table('cash_flow_transactions')->where('created_by', $user->id)->update(['created_by' => null]);
            DB::table('cash_flow_transactions')->where('updated_by', $user->id)->update(['updated_by' => null]);
            
            // Hard delete the user
            $user->delete();

            DB::commit();
            return response()->json(['message' => 'User deleted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Delete failed: ' . $e->getMessage()
            ], 500);
        }
    }


    public function hierarchy(User $user = null): JsonResponse
    {
        $user = $user ?? auth()->user();

        // Get the full team structure with all nested subordinates
        $hierarchyData = $this->formatHierarchy($user);

        return response()->json(['data' => $hierarchyData]);
    }

    private function formatHierarchy(User $user): array
    {
        // Load the user with all subordinates
        $userWithSubordinates = $user->load('children.children');

        // Format basic user data
        $result = [
            'id' => $user->id,
            'name' => $user->name,
            'title' => $user->designation ? $user->designation->name : 'N/A',
            'department' => $user->department ? $user->department->name : 'N/A',
            'email' => $user->email,
            'hierarchy_level' => $user->hierarchy_level,
            'children' => []
        ];

        // Add children recursively
        foreach ($userWithSubordinates->children as $child) {
            $result['children'][] = $this->formatHierarchy($child);
        }

        return $result;
    }

    public function getUsersByLevel(int $level): JsonResponse
    {
        $users = User::where('hierarchy_level', $level)->get();
        return response()->json(['data' => $users]);
    }

    public function reportingChain(User $user = null): JsonResponse
    {
        $user = $user ?? auth()->user();
        $chain = $user->getReportingChain();

        return response()->json(['data' => $chain]);
    }

    public function organogram(User $user = null): JsonResponse
    {
        if ($user === null) {
            // Find the user with hierarchy_level = 0 and null parent_id
            $user = User::where('hierarchy_level', 0)
                ->whereNull('parent_id')
                ->whereHas('children') // Ensures the user has at least one child
                ->first();

            // If no hierarchy level 0 user, try to find any root user
            if (!$user) {
                $user = User::whereNull('parent_id')->first();
            }

            // If still no root user found, use any user as root
            if (!$user) {
                $user = User::first();
            }
        }

        // Build the organogram data starting from this user
        if ($user) {
            $orgData = $this->buildCompleteOrganogram();
            return response()->json(['data' => $orgData]);
        }

        return response()->json(['data' => [], 'message' => 'No users found']);
    }

    private function buildCompleteOrganogram(): array
    {
        // Find the root user with hierarchy_level = 0 and null parent_id
        $rootUser = User::where('hierarchy_level', 0)
        ->whereNull('parent_id')
        ->with(['designation', 'department'])
        ->first();

        if (!$rootUser) {
            return [];
        }

        // // Format the root node
        // $result = [
        //     'id' => $rootUser->id,
        //     'name' => $rootUser->name ?? 'N/A',
        //     'title' => $rootUser->designation ? $rootUser->designation->designation : 'N/A',
        //     'department' => $rootUser->department ? $rootUser->department->name : 'N/A',
        //     'email' => $rootUser->email,
        //     'level' => $rootUser->hierarchy_level,
        //     'image' => $rootUser->attachment,
        //     'children' => []
        // ];

        // // Find all direct children of the root user
        // $directChildren = User::where('parent_id', $rootUser->id)
        // ->with(['designation', 'department'])
        // ->get();

        // foreach ($directChildren as $child) {
        //     $result['children'][] = [
        //         'id' => $child->id,
        //         'name' => $child->name,
        //         'title' => $child->designation ? $child->designation->designation : 'N/A',
        //         'department' => $child->department ? $child->department->name : 'N/A',
        //         'email' => $child->email,
        //         'level' => $child->hierarchy_level,
        //         'image' => $child->attachment,
        //         'children' => []
        //     ];
        // }

        return $this->buildOrganogramData($rootUser);
    }

    private function buildOrganogramData(User $user): array
    {
        // Load essential relations including nested children
        $user->load(['designation', 'department', 'children.designation', 'children.department', 'children.children']);

        // Format node data
        $node = [
            'id' => $user->id,
            'name' => $user->name,
            'title' => $user->designation ? $user->designation->designation : 'N/A',
            'department' => $user->department ? $user->department->name : 'N/A',
            'email' => $user->email,
            'level' => $user->hierarchy_level,
            'image' => $user->attachment,
            'designation_id' => $user->designation_id,
            'parent_id' => $user->parent_id,
            'children' => []
        ];

        // Process children recursively
        foreach ($user->children as $child) {
            $node['children'][] = $this->buildOrganogramData($child);
        }

        return $node;
    }

    public function getCurrentRole(): JsonResponse
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }

        $role = $user->roles()->first();

        if (!$role) {
            return response()->json([
                'message' => 'User has no assigned role',
                'role' => null
            ]);
        }

        return response()->json([
            'role' => $role
        ]);
    }

    public function getPermissions(User $user)
    {
        return response()->json([
            'data' => $user->getAllPermissions()
        ]);
    }

    public function getCombinedPermissions(User $user)
    {
        // Get user's role
        $userRole = $user->roles()->first();
        if (!$userRole) {
            return response()->json([
                'data' => []
            ]);
        }

        // Get role permissions
        $rolePermissions = $userRole->permissions->pluck('name')->toArray();
        
        // Get user permission overrides
        $userOverrides = UserPermissionOverrideService::getUserOverrides($user);
        
        // Debug logging
        \Log::info('🔍 User overrides for ' . $user->name . ' (ID: ' . $user->id . '):', $userOverrides);
        \Log::info('🎭 Role permissions:', $rolePermissions);
        
        // Define permission categories (same as frontend)
        $permissionCategories = [
            "Requests" => [
                "base" => "view_requests",
                "subOptions" => [
                    "Request New Item" => ["base" => "request_new_item"],
                    "Make New Request" => ["base" => "make_new_request"]
                ]
            ],
            "Task Center" => [
                "base" => "view_tasks",
                "subOptions" => []
            ],
            "Procurement Center" => [
                "base" => "view_procurement",
                "subOptions" => [
                    "RFQs" => [
                        "base" => "view_rfqs",
                        "subOptions" => [
                            "Make New RFQ" => ["base" => "make_new_rfq"]
                        ]
                    ],
                    "Quotations" => [
                        "base" => "view_quotations",
                        "subOptions" => [
                            "Add Supplier" => ["base" => "add_supplier"],
                            "Add New Quotation" => ["base" => "add_new_quotation"]
                        ]
                    ],
                    "Purchase Orders" => [
                        "base" => "view_purchase_orders",
                        "subOptions" => [
                            "Create New Purchase Order" => ["base" => "create_new_purchase_order"]
                        ]
                    ],
                    "External Invoices" => [
                        "base" => "view_invoices",
                        "subOptions" => [
                            "Add Invoice" => ["base" => "add_invoice"]
                        ]
                    ]
                ]
            ],
            "Finance Center" => [
                "base" => "view_finance",
                "subOptions" => [
                    "Maharat Invoices" => [
                        "base" => "view_maharat_invoices",
                        "subOptions" => [
                            "Add Customers" => ["base" => "add_customers"],
                            "Create New Invoice" => ["base" => "create_new_invoice"]
                        ]
                    ],
                    "Accounts" => [
                        "base" => "view_accounts",
                        "subOptions" => [
                            "Create New Account" => ["base" => "create_new_account"]
                        ]
                    ],
                    "Payment Orders" => [
                        "base" => "view_payment_orders",
                        "subOptions" => [
                            "Create Payment Order" => ["base" => "create_payment_order"]
                        ]
                    ],
                    "Account Receivables" => ["base" => "view_account_receivables"],
                    "Account Payables" => ["base" => "view_account_payables"]
                ]
            ],
            "Warehouse" => [
                "base" => "view_warehouse",
                "subOptions" => [
                    "User Material Requests" => ["base" => "view_material_requests"],
                    "Categories" => [
                        "base" => "view_categories",
                        "subOptions" => [
                            "Create New Category" => ["base" => "create_categories"]
                        ]
                    ],
                    "Items" => [
                        "base" => "view_items",
                        "subOptions" => [
                            "Create New Item" => ["base" => "create_items"]
                        ]
                    ],
                    "Goods Receiving Notes" => [
                        "base" => "view_goods_receiving_notes",
                        "subOptions" => [
                            "Create Good Receiving Notes" => ["base" => "create_goods_receiving_notes"]
                        ]
                    ],
                    "Inventory Tracking" => [
                        "base" => "view_inventory_tracking",
                        "subOptions" => [
                            "Add Inventory" => ["base" => "add_inventory"]
                        ]
                    ],
                    "Create Warehouse" => ["base" => "create_warehouse"]
                ]
            ],
            "Budget & Accounts" => [
                "base" => "view_budget",
                "subOptions" => [
                    "Manage Budget" => ["base" => "manage_budget"],
                    "Approve Budget" => ["base" => "approve_budget"]
                ]
            ],
            "Status" => [
                "base" => "view_statuses",
                "subOptions" => []
            ],
            "Configuration Center" => [
                "base" => "view_configuration",
                "subOptions" => [
                    "Process Flow" => ["base" => "view_process_flow"],
                    "Notification Settings" => ["base" => "manage_settings"]
                ]
            ],
            "Sidebar" => [
                "base" => "view_notifications",
                "subOptions" => [
                    "Notification" => ["base" => "view_notifications"],
                    "Profile Settings" => ["base" => "edit_profile"],
                    "User Manual" => ["base" => "view_user_manual"],
                    "FAQs" => ["base" => "view_faqs"]
                ]
            ]
        ];

        // Build combined permissions
        $combinedPermissions = [];
        $userHasOverrides = count($userOverrides) > 0;

        foreach ($permissionCategories as $category => $config) {
            $hasRoleMainPermission = in_array($config['base'], $rolePermissions);
            $hasUserOverride = isset($userOverrides[$config['base']]);
            
            // If user has override for this permission, use user's setting
            // Otherwise, use role permission
            $mainPermission = $hasUserOverride ? $userOverrides[$config['base']] : $hasRoleMainPermission;
            $isUserOverride = $hasUserOverride;

            $combinedPermissions[$category] = [
                'main' => $mainPermission,
                'subOptions' => [],
                'isUserOverride' => $isUserOverride
            ];

            // Process sub-options
            foreach ($config['subOptions'] as $subOption => $subConfig) {
                $hasRoleSubPermission = in_array($subConfig['base'], $rolePermissions);
                $hasUserSubOverride = isset($userOverrides[$subConfig['base']]);
                
                // If user has override for this sub-permission, use user's setting
                // Otherwise, use role permission
                $subPermission = $hasUserSubOverride ? $userOverrides[$subConfig['base']] : $hasRoleSubPermission;
                $isSubUserOverride = $hasUserSubOverride;

                $combinedPermissions[$category]['subOptions'][$subOption] = [
                    'enabled' => $subPermission,
                    'subOptions' => [],
                    'isUserOverride' => $isSubUserOverride
                ];

                // Process nested sub-options
                if (isset($subConfig['subOptions'])) {
                    foreach ($subConfig['subOptions'] as $nestedSubOption => $nestedConfig) {
                        $hasRoleNestedPermission = in_array($nestedConfig['base'], $rolePermissions);
                        $hasUserNestedOverride = isset($userOverrides[$nestedConfig['base']]);
                        
                        // If user has override for this nested permission, use user's setting
                        // Otherwise, use role permission
                        $nestedPermission = $hasUserNestedOverride ? $userOverrides[$nestedConfig['base']] : $hasRoleNestedPermission;
                        $isNestedUserOverride = $hasUserNestedOverride;

                        $combinedPermissions[$category]['subOptions'][$subOption]['subOptions'][$nestedSubOption] = [
                            'enabled' => $nestedPermission,
                            'isUserOverride' => $isNestedUserOverride
                        ];
                    }
                }
            }
        }

        // Debug logging
        \Log::info('🎯 Final combined permissions for ' . $user->name . ':', $combinedPermissions);
        
        return response()->json([
            'data' => $combinedPermissions
        ]);
    }

    public function togglePermission(Request $request, User $user)
    {
        $validated = $request->validate([
            'permission' => 'required|string',
            'value' => 'required|boolean'
        ]);

        // Use the new service to handle permission overrides
        \Log::info('🔄 Toggling permission for ' . $user->name . ':', [
            'permission' => $validated['permission'],
            'value' => $validated['value']
        ]);
        
        UserPermissionOverrideService::setOverride(
            $user, 
            $validated['permission'], 
            $validated['value']
        );

        $finalOverrides = UserPermissionOverrideService::getUserOverrides($user);
        \Log::info('✅ Final overrides after toggle:', $finalOverrides);

        return response()->json([
            'success' => true,
            'data' => $finalOverrides
        ]);
    }

    public function current()
    {
        $user = auth()->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated'
            ], 401);
        }

        return new UserResource($user);
    }


    // In your UserController or Service
    public function setupDefaultNotificationSettings(User $user)
    {
        $notificationTypes = NotificationType::all();
        $channels = NotificationChannel::all();

        // Default configuration for process flow notifications
        $defaultSettings = [
            'material_request' => ['email' => true, 'system' => true, 'sms' => false],
            'rfq_approval' => ['email' => true, 'system' => true, 'sms' => false],
            'purchase_order_approval' => ['email' => true, 'system' => true, 'sms' => false],
            'maharat_invoice_approval' => ['email' => true, 'system' => true, 'sms' => false],
            'payment_order_approval' => ['email' => true, 'system' => true, 'sms' => false],
            'budget_request_approval' => ['email' => true, 'system' => true, 'sms' => false],
            'total_budget_approval' => ['email' => true, 'system' => true, 'sms' => false],
        ];

        foreach ($notificationTypes as $type) {
            foreach ($channels as $channel) {
                $isEnabled = $defaultSettings[$type->key][$channel->key] ?? false;

                UserNotificationSetting::create([
                    'user_id' => $user->id,
                    'notification_type_id' => $type->id,
                    'notification_channel_id' => $channel->id,
                    'is_user' => $isEnabled,
                    'is_enabled' => $isEnabled,
                ]);
            }
        }
    }

}