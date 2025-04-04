<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Designation;
use App\Models\Role;
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
    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request)
    {
        $validated = $request->validated();

        // Set the hashed password
        $validated['password'] = Hash::make($validated['password']);

        // Handle profile photo
        if ($request->hasFile('profile_photo_path')) {
            $file = $request->file('profile_photo_path');
            $path = $file->store('profile_photos', 'public');
            $validated['profile_photo_path'] = asset("storage/$path");
        }

        $user = User::create($validated);
        $role = Role::find($request->role_id);
        $user->assignRole($role->name);

        return new UserResource($user);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        return new UserResource($user);
    }


    /**
     * Update the specified user in storage.
     * Handles both permission names and IDs.
     *
     * @param UpdateUserRequest $request
     * @param User $user
     * @return UserResource|\Illuminate\Http\JsonResponse
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        // Log request info
//        Log::info("Update request received for user ID: {$user->id}", [
//            'user_original' => $user->toArray(),
//            'request_data' => $request->all(),
//        ]);

        // Validate the request
        $validated = $request->validated();
//        Log::info("Validated data:", $validated);

        if (empty($validated)) {
//            Log::warning("Empty validated data - no fields passed validation!");
            return response()->json(['error' => 'No valid fields to update'], 422);
        }

        // Begin database transaction
        DB::beginTransaction();

        try {
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
//                        Log::info("Assigned role '{$role->name}' to user {$user->id}");
                    } else {
//                        Log::warning("Role with ID {$roleId} not found");
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
//                                    Log::info("Found permission by name: {$permission}");
                                } else {
//                                    Log::warning("Permission not found by name: {$permission}");
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
//                                    Log::info("Found permission by ID: {$permission} (name: {$p->name})");
                                } else {
//                                    Log::warning("Permission not found by ID: {$permission}");
                                }
                            } catch (\Exception $e) {
                                Log::error("Error finding permission by ID {$permission}: " . $e->getMessage());
                            }
                        }
                    }

                    if (!empty($permissionObjects)) {
                        // Sync permissions (replaces all existing permissions)
                        $user->syncPermissions($permissionObjects);
//                        Log::info("Synced " . count($permissionObjects) . " permissions to user {$user->id}");
                    } else {
                        Log::warning("No valid permissions found to sync");
                    }
                } catch (\Exception $e) {
                    Log::error("Error syncing permissions: " . $e->getMessage());
                    throw $e;
                }
            }

            // Handle permission removal if specified
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
//            Log::info("User data after update:", [
//                'id' => $user->id,
//                'name' => $user->name,
//                'roles' => $user->roles->pluck('name'),
//                'permissions' => $user->getAllPermissions()->pluck('name')
//            ]);

            return new UserResource($user);

        } catch (\Exception $e) {
            DB::rollBack();

//            Log::error("Exception during update: " . $e->getMessage(), [
//                'trace' => $e->getTraceAsString()
//            ]);

            return response()->json(['error' => 'Update failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        $user->delete();

        return response()->noContent();
    }

    /**
     * Get the hierarchical structure under a user
     *
     * @param \App\Models\User|null $user
     * @return \Illuminate\Http\JsonResponse
     */
    public function hierarchy(User $user = null): JsonResponse
    {
        $user = $user ?? auth()->user();

        // Get the full team structure with all nested subordinates
        $hierarchyData = $this->formatHierarchy($user);

        return response()->json(['data' => $hierarchyData]);
    }

    /**
     * Format user hierarchy data recursively
     *
     * @param \App\Models\User $user
     * @return array
     */
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


    /**
     * Get users at a specific hierarchy level
     *
     * @param int $level
     * @return \Illuminate\Http\JsonResponse
     */
    public function getUsersByLevel(int $level): JsonResponse
    {
        $users = User::where('hierarchy_level', $level)->get();
        return response()->json(['data' => $users]);
    }

    /**
     * Get a user's reporting chain (path to top of organization)
     *
     * @param \App\Models\User|null $user
     * @return \Illuminate\Http\JsonResponse
     */
    public function reportingChain(User $user = null): JsonResponse
    {
        $user = $user ?? auth()->user();
        $chain = $user->getReportingChain();

        return response()->json(['data' => $chain]);
    }


    /**
     * Get organizational chart data
     *
     * @param User|null $user
     * @return JsonResponse
     */
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

    /**
     * Build a complete organogram structure from all users
     *
     * @return array
     */
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

    /**
     * Build organogram data structure recursively
     *
     * @param User $user
     * @return array
     */
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
            'children' => []
        ];

        // Process children recursively
        foreach ($user->children as $child) {
            $node['children'][] = $this->buildOrganogramData($child);
        }

        return $node;
    }


    /*
    public function hierarchy(User $user = null): JsonResponse
    {
        $user = $user ?? auth()->user();
         $hierarchy = $this->buildUserHierarchy($user);

        return response()->json(['data' => $hierarchy]);
    }

    private function buildUserHierarchy(User $user): array
    {
        $hierarchy = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'roles' => $user->roles->pluck('name'),
            'children' => []
        ];

        foreach ($user->roles as $role) {
            $roleIds = Role::where(function($query) use ($role) {
                $path = explode('.', $role->id);
                $query->where('parent_role_id', $role->id);
            })->pluck('id');

            if ($roleIds->isNotEmpty()) {
                $subordinates = User::whereHas('roles', function($query) use ($roleIds) {
                    $query->whereIn('id', $roleIds);
                })->get();

                foreach ($subordinates as $subordinate) {
                    $hierarchy['children'][] = $this->buildUserHierarchy($subordinate);
                }
            }
        }

        return $hierarchy;
    }
    */

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

}
