<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Spatie\Permission\Models\Permission;

class RoleController extends Controller
{


    public function index(): JsonResponse
    {
        $roles = Role::with(['permissions', 'parent', 'children'])->get();

        return response()->json([
            'data' => $roles
        ], Response::HTTP_OK);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:roles,name',
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name',
            'parent_role_id' => 'nullable|exists:roles,id'
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
            'parent_role_id' => $validated['parent_role_id'] ?? null
        ]);

        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json([
            'message' => 'Role created successfully',
            'data' => $role->load(['permissions', 'parent', 'children'])
        ], 201);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:roles,name,' . $role->id,
            'permissions' => 'array',
            'permissions.*' => 'exists:permissions,name',
            'parent_role_id' => 'nullable|exists:roles,id'
        ]);

        $role->update([
            'name' => $validated['name'],
            'parent_role_id' => $validated['parent_role_id'] ?? null
        ]);

        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json([
            'message' => 'Role updated successfully',
            'data' => $role->load(['permissions', 'parent', 'children'])
        ]);
    }

    public function destroy(Role $role): JsonResponse
    {
        Role::where('parent_role_id', $role->id)
            ->update(['parent_role_id' => null]);

        $role->delete();

        return response()->json([
            'message' => 'Role deleted successfully'
        ]);
    }



    public function subordinates(Role $role): JsonResponse
    {
        $subordinateIds = $role->subordinates();
        $subordinates = Role::whereIn('id', $subordinateIds)->get();

        return response()->json([
            'data' => $subordinates
        ]);
    }

    public function superiors(Role $role): JsonResponse
    {
        $superiorIds = $role->superiors();
        $superiors = Role::whereIn('id', $superiorIds)->get();

        return response()->json([
            'data' => $superiors
        ]);
    }

    public function show(Role $role): JsonResponse
    {
        return response()->json([
            'data' => $role->load(['permissions', 'parent', 'children'])
        ]);
    }

    public function hierarchy(): JsonResponse
    {
        $roles = Role::with(['children.children', 'parent'])
            ->whereNull('parent_role_id')
            ->get();

        return response()->json([
            'data' => $roles
        ]);
    }

}
