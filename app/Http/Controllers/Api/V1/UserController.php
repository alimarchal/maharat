<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Designation;
use App\Models\NotificationChannel;
use App\Models\NotificationType;
use App\Models\Role;
use App\Models\UserNotificationSetting;
use App\Services\NotificationSettingsService;
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

class UserController extends Controller
{
    protected $notificationSettingsService;

    public function __construct(NotificationSettingsService $notificationSettingsService)
    {
        $this->notificationSettingsService = $notificationSettingsService;
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
        
        // Get the designation
        $designation = Designation::find($user->designation_id);
        
        if ($designation) {
            // Assign role based on designation
            $user->assignRole($designation->designation);
            
            // Assign permissions based on designation
            $user->assignPermissionsBasedOnDesignation();
        } else if ($request->role_id) {
            // Fallback to role_id if designation is not found
            $role = Role::find($request->role_id);
            if ($role) {
                $user->assignRole($role->name);
            }
        }

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

            // Extract permission-related data before updating the user model
            $roleId = $validated['role_id'] ?? null;
            $permissions = $validated['permissions'] ?? null;
            $removePermissions = $validated['remove_permissions'] ?? null;

            // Remove these fields so they don't interfere with the update
            unset($validated['role_id'], $validated['permissions'], $validated['remove_permissions']);

            // Update user basic information
            $user->update($validated);

            // Handle role updates if provided
            if ($roleId) {
                try {
                    // Remove all current roles
                    $user->roles()->detach();

                    // Assign new role - specify the 'web' guard
                    $role = Role::findById($roleId, 'web');
                    if ($role) {
                        $user->assignRole($role);
                    }
                } catch (\Exception $e) {
                    Log::error("Error assigning role: " . $e->getMessage());
                    throw $e;
                }
            }

            // Handle direct permission updates if provided
            if (is_array($permissions)) {
                try {
                    $permissionObjects = [];

                    foreach ($permissions as $permission) {
                        if (is_string($permission) && !is_numeric($permission)) {
                            // Find permission by name
                            try {
                                $p = Permission::where('name', $permission)->where('guard_name', 'web')->first();
                                if ($p) {
                                    $permissionObjects[] = $p;
                                }
                            } catch (\Exception $e) {
                                Log::error("Error finding permission by name '{$permission}': " . $e->getMessage());
                            }
                        } else {
                            // Find permission by ID
                            try {
                                $p = Permission::findById($permission, 'web');
                                if ($p) {
                                    $permissionObjects[] = $p;
                                }
                            } catch (\Exception $e) {
                                Log::error("Error finding permission by ID {$permission}: " . $e->getMessage());
                            }
                        }
                    }

                    if (!empty($permissionObjects)) {
                        // Sync permissions (replaces all existing permissions)
                        $user->syncPermissions($permissionObjects);
                    }
                } catch (\Exception $e) {
                    Log::error("Error syncing permissions: " . $e->getMessage());
                    throw $e;
                }
            }

            if (is_array($removePermissions)) {
                try {
                    foreach ($removePermissions as $permission) {
                        if (is_string($permission) && !is_numeric($permission)) {
                            // Remove by name
                            if ($user->hasPermissionTo($permission, 'web')) {
                                $user->revokePermissionTo($permission);
//                                Log::info("Revoked permission by name: {$permission}");
                            } else {
//                                Log::info("User doesn't have permission '{$permission}' to revoke");
                            }
                        } else {
                            // Remove by ID
                            try {
                                $p = Permission::findById($permission, 'web');
                                if ($p && $user->hasPermissionTo($p)) {
                                    $user->revokePermissionTo($p);
//                                    Log::info("Revoked permission by ID: {$permission} (name: {$p->name})");
                                } else {
//                                    Log::info("User doesn't have permission with ID {$permission} to revoke");
                                }
                            } catch (\Exception $e) {
//                                Log::error("Error finding permission to revoke by ID {$permission}: " . $e->getMessage());
                            }
                        }
                    }
                } catch (\Exception $e) {
//                    Log::error("Error revoking permissions: " . $e->getMessage());
                    throw $e;
                }
            }

            DB::commit();

            // Refresh user to include updated relationships
            $user->refresh();

            return new UserResource($user);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Update failed: ' . $e->getMessage()], 500);
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

    public function togglePermission(Request $request, User $user)
    {
        $validated = $request->validate([
            'permission' => 'required|string',
            'value' => 'required|boolean'
        ]);

        if ($validated['value']) {
            $user->givePermissionTo($validated['permission']);
        } else {
            $user->revokePermissionTo($validated['permission']);
        }

        return response()->json([
            'success' => true,
            'data' => $user->getAllPermissions()
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

        // Default configuration similar to your UI
        $defaultSettings = [
            'rfq_document' => ['email' => true, 'system' => false, 'sms' => false],
            'quotations_document' => ['email' => false, 'system' => true, 'sms' => true],
            'goods_receiving_notes' => ['email' => false, 'system' => true, 'sms' => false],
            'mrs_documents' => ['email' => true, 'system' => false, 'sms' => false],
            'invoices_documents' => ['email' => false, 'system' => false, 'sms' => false],
            'pmntos_documents' => ['email' => false, 'system' => false, 'sms' => false],
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
