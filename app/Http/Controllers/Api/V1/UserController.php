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

class UserController extends Controller
{


    public function index(Request $request)
    {
        $users = User::query()
            ->with(['roles', 'permissions']) // Eager load relationships
            ->when($request->search, function($query, $search) {
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($request->sort, function($query, $sort) {
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
        $validated['password'] = Hash::make($validated['password']);

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
}
