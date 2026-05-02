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
    public function index(Request $request): JsonResponse
    {
        $users = User::with('role')
        ->when($request->role_id, fn($q) => $q->where('role_id', $request->role_id))
        ->when($request->search, function($q) use ($request) {
            $s = $request->search;
            $q->where(function($sub) use ($s) {
                $sub->where('name', 'LIKE', "%$s%")
                    ->orWhere('email', 'LIKE', "%$s%")
                    ->orWhere('phone', 'LIKE', "%$s%");
            });
        })
        ->withCount([
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
            'role_id'  => 'required|exists:roles,id',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $user = User::create($validated);

        return response()->json($user->load('role'), 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name'     => 'sometimes|required|string|max:255',
            'email'    => 'sometimes|required|email|unique:users,email,' . $user->id,
            'phone'    => 'nullable|string|max:30|unique:users,phone,' . $user->id,
            'password' => 'nullable|string|min:6',
            'role_id'  => 'sometimes|required|exists:roles,id',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json($user->load('role'));
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
        $logs = ActivityLog::with('user:id,name,role_id')
            ->orderByDesc('created_at')
            ->when($request->user_id, fn($q) => $q->where('user_id', $request->user_id))
            ->when($request->action,  fn($q) => $q->where('action', $request->action))
            ->limit(200)
            ->get();

        return response()->json($logs);
    }

    public function bulkImport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'users' => 'required|array',
            'users.*.name' => 'required|string|max:255',
            'users.*.email' => 'required|email|unique:users,email',
            'users.*.phone' => 'nullable|string|max:30',
            'users.*.password' => 'required|string|min:6',
            'users.*.role_id' => 'required|exists:roles,id',
        ]);

        $createdUsers = [];
        DB::transaction(function () use ($validated, &$createdUsers) {
            foreach ($validated['users'] as $userData) {
                $userData['password'] = Hash::make($userData['password']);
                $createdUsers[] = User::create($userData);
            }
        });

        return response()->json([
            'message' => count($createdUsers) . ' users created successfully.',
            'users' => User::with('role')->whereIn('id', collect($createdUsers)->pluck('id'))->get()
        ], 201);
    }
}
