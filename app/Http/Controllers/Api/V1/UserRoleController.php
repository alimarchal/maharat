<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserRoleController extends Controller
{
    public function assignRoles(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'exists:roles,name'
        ]);

        $user->syncRoles($validated['roles']);

        return response()->json([
            'message' => 'Roles assigned successfully',
            'data' => $user->load('roles')
        ]);
    }

    public function getUsersByRole(Role $role): JsonResponse
    {
        $users = User::role($role->name)->get();

        return response()->json([
            'data' => $users
        ]);
    }

    public function getSubordinateUsers(User $user): JsonResponse
    {
        $subordinateRoles = collect();

        foreach ($user->roles as $role) {
            $subordinateRoles = $subordinateRoles->merge($role->subordinates());
        }

        $subordinateUsers = User::role($subordinateRoles)->get();

        return response()->json([
            'data' => $subordinateUsers
        ]);
    }
}