<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'identifier' => 'required|string',
            'password'   => 'required',
        ]);

        $identifier = $request->identifier;
        $field = filter_var($identifier, FILTER_VALIDATE_EMAIL) ? 'email' : 'phone';

        $user = User::where($field, $identifier)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'بيانات الدخول غير صحيحة'], 401);
        }

        // Enforce single session per user
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        ActivityLog::create([
            'user_id'     => $user->id,
            'action'      => 'login',
            'description' => 'تسجيل دخول ناجح',
            'ip_address'  => $request->ip(),
        ]);

        return response()->json([
            'token' => $token,
            'user'  => $user->load('role.permissions'),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        ActivityLog::create([
            'user_id'     => $request->user()->id,
            'action'      => 'logout',
            'description' => 'تسجيل خروج',
            'ip_address'  => $request->ip(),
        ]);

        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'تم تسجيل الخروج بنجاح']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user()->load('role.permissions'));
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'     => 'sometimes|required|string|max:255',
            'email'    => 'sometimes|required|email|unique:users,email,' . $user->id,
            'phone'    => 'nullable|string|max:20',
            'password' => 'nullable|string|min:6',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        ActivityLog::create([
            'user_id'     => $user->id,
            'action'      => 'update_profile',
            'description' => 'تحديث الملف الشخصي',
            'ip_address'  => $request->ip(),
        ]);

        return response()->json($user->load('role.permissions'));
    }
}
