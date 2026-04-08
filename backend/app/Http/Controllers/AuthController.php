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

        $token = $user->createToken('auth_token')->plainTextToken;

        ActivityLog::create([
            'user_id'     => $user->id,
            'action'      => 'login',
            'description' => 'تسجيل دخول ناجح',
            'ip_address'  => $request->ip(),
        ]);

        return response()->json([
            'token' => $token,
            'user'  => $user,
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
        return response()->json($request->user());
    }
}
