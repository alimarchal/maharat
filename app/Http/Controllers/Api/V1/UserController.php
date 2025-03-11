<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Requests\V1\StoreUserRequest;
use App\Http\Requests\V1\UpdateUserRequest;
use App\Http\Resources\V1\UserResource;
use App\Http\Resources\V1\UserCollection;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
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

        // Handle attachment if present
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $path = $file->store('attachments');
            $validated['attachment'] = $path;
        }

        $user = User::create($validated);

        return new UserResource($user);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        return (new UserResource($user))->additional(['hierarchy' => self::buildUserHierarchy($user)]);
    }


    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        $validated = $request->validated();

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        // Handle file upload first
        if ($request->hasFile('attachment')) {
            // Remove old file if it exists
            if ($user->attachment && Storage::disk('public')->exists($user->attachment)) {
                Storage::disk('public')->delete($user->attachment);
            }

            $path = $request->file('attachment')->store('user-profiles', 'public');
            $validated['attachment'] = $path; // Include path in the data being updated
        }

        $user->update($validated);

        return new UserResource($user);
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
            'designation' => $user->designation ? $user->designation->name : null,
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
        $user = $user ?? User::whereNull('parent_id')->first(); // Start from top if no user specified

        $orgData = $this->buildOrganogramData($user);

        return response()->json(['data' => $orgData]);
    }

    /**
     * Build organogram data structure recursively
     *
     * @param User $user
     * @return array
     */
    private function buildOrganogramData(User $user): array
    {
        // Load essential relations
        $user->load(['designation', 'children.designation', 'department']);

        // Format node data
        $node = [
            'id' => $user->id,
            'name' => $user->name,
            'title' => $user->designation ? $user->designation->name : '',
            'department' => $user->department ? $user->department->name : '',
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

}
