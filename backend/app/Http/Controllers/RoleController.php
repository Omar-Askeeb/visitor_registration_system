<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::with('permissions')->get();
        return response()->json($roles);
    }

    public function permissions(): JsonResponse
    {
        $permissions = Permission::all();
        return response()->json($permissions);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'         => 'required|string|unique:roles,name',
            'display_name' => 'required|string',
            'color'        => 'nullable|string',
            'description'  => 'nullable|string',
            'permissions'  => 'array',
            'permissions.*'=> 'exists:permissions,id',
        ]);

        $role = Role::create([
            'name'         => $validated['name'],
            'display_name' => $validated['display_name'],
            'color'        => $validated['color'] ?? 'slate',
            'description'  => $validated['description'] ?? null,
        ]);

        if (isset($validated['permissions'])) {
            $role->permissions()->sync($validated['permissions']);
        }

        return response()->json($role->load('permissions'), 201);
    }

    public function update(Request $request, Role $role): JsonResponse
    {
        if (in_array($role->name, ['admin', 'data_entry', 'auditor', 'self_service_device'])) {
            return response()->json(['message' => 'Cannot modify default system roles'], 403);
        }

        $validated = $request->validate([
            'name'         => 'sometimes|required|string|unique:roles,name,' . $role->id,
            'display_name' => 'sometimes|required|string',
            'color'        => 'nullable|string',
            'description'  => 'nullable|string',
            'permissions'  => 'array',
            'permissions.*'=> 'exists:permissions,id',
        ]);

        $role->update($validated);

        if (isset($validated['permissions'])) {
            $role->permissions()->sync($validated['permissions']);
        }

        return response()->json($role->load('permissions'));
    }

    public function destroy(Role $role): JsonResponse
    {
        if (in_array($role->name, ['admin', 'data_entry', 'auditor', 'self_service_device'])) {
            return response()->json(['message' => 'Cannot delete default system roles'], 403);
        }
        
        $role->delete();
        return response()->json(['message' => 'Role deleted.']);
    }
}
