<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::withCount([
            'visitorsCreated as visitors_created_count',
            'visitorsModified as visitors_updated_count',
            'fixedRecords as fixed_records_count',
            'verifiedRecords as verified_records_count',
        ])
        ->addSelect([
            'avg_fill_time'  => DB::table('training_records')->whereColumn('user_id', 'users.id')->selectRaw('AVG(fill_duration)'),
            'best_fill_time' => DB::table('training_records')->whereColumn('user_id', 'users.id')->selectRaw('MIN(fill_duration)'),
            'worst_fill_time'=> DB::table('training_records')->whereColumn('user_id', 'users.id')->selectRaw('MAX(fill_duration)'),
            'training_count' => DB::table('training_records')->whereColumn('user_id', 'users.id')->selectRaw('COUNT(*)'),
        ])->get();

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'phone'    => 'nullable|string|max:30|unique:users,phone',
            'password' => 'required|string|min:6',
            'role'     => 'required|in:admin,data_entry,auditor',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $user = User::create($validated);

        return response()->json($user->only(['id', 'name', 'email', 'phone', 'role', 'created_at']), 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name'     => 'sometimes|required|string|max:255',
            'email'    => 'sometimes|required|email|unique:users,email,' . $user->id,
            'phone'    => 'nullable|string|max:30|unique:users,phone,' . $user->id,
            'password' => 'nullable|string|min:6',
            'role'     => 'sometimes|required|in:admin,data_entry,auditor',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json($user->only(['id', 'name', 'email', 'phone', 'role', 'created_at']));
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();
        return response()->json(['message' => 'User deleted.']);
    }

    public function performance(Request $request, User $user): JsonResponse
    {
        $eventId = $request->event_id;

        // Daily Created Records
        $created = $user->visitorsCreated()
            ->when($eventId, fn($q) => $q->where('event_id', $eventId))
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->get();

        // Daily Verified/Fixed Records (Auditor work)
        $verified = $user->verifiedRecords()
            ->when($eventId, fn($q) => $q->where('event_id', $eventId))
            ->select(DB::raw('DATE(updated_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->get();

        return response()->json([
            'user'     => $user->only(['id', 'name', 'role']),
            'created'  => $created,
            'verified' => $verified,
        ]);
    }

    public function logs(Request $request): JsonResponse
    {
        $logs = ActivityLog::with('user:id,name,role')
            ->orderByDesc('created_at')
            ->when($request->user_id, fn($q) => $q->where('user_id', $request->user_id))
            ->when($request->action,  fn($q) => $q->where('action', $request->action))
            ->limit(200)
            ->get();

        return response()->json($logs);
    }
}
