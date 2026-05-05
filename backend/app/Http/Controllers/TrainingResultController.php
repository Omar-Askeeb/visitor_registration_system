<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\TrainingRecord;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class TrainingResultController extends Controller
{
    /**
     * Get a list of users with their training statistics.
     */
    public function index(Request $request): JsonResponse
    {
        $eventId = $request->query('event_id');

        // Query users that have at least one training record
        // We'll aggregate the stats using subqueries or DB raw
        $users = User::query()
            ->withCount(['trainingRecords as forms_inserted_count' => function ($query) use ($eventId) {
                if ($eventId) $query->where('event_id', $eventId);
            }])
            ->withMin(['trainingRecords as training_records_min_fill_duration' => function ($query) use ($eventId) {
                if ($eventId) $query->where('event_id', $eventId);
            }], 'fill_duration')
            ->withMax(['trainingRecords as training_records_max_fill_duration' => function ($query) use ($eventId) {
                if ($eventId) $query->where('event_id', $eventId);
            }], 'fill_duration')
            ->withAvg(['trainingRecords as training_records_avg_fill_duration' => function ($query) use ($eventId) {
                if ($eventId) $query->where('event_id', $eventId);
            }], 'fill_duration')
            ->withCount([
                'trainingRecords as audited_count' => function ($query) use ($eventId) {
                    if ($eventId) $query->where('event_id', $eventId);
                    $query->where('is_audited', true);
                },
                'trainingRecords as changed_count' => function ($query) use ($eventId) {
                    if ($eventId) $query->where('event_id', $eventId);
                    $query->where('is_audited', true)->where('audit_changed', true);
                }
            ]);

        // If filtering by event, we might want to only show users who have records in that event
        if ($eventId) {
            $users->whereHas('trainingRecords', function ($query) use ($eventId) {
                $query->where('event_id', $eventId);
            });
        }

        $users = $users->get()
            ->map(function ($user) {
                // Calculate accuracy
                $accuracy = 100;
                if ($user->audited_count > 0) {
                    $unchanged = $user->audited_count - $user->changed_count;
                    $accuracy = round(($unchanged / $user->audited_count) * 100, 2);
                } elseif ($user->audited_count === 0 && $user->forms_inserted_count > 0) {
                    $accuracy = 100; 
                }

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone ?? '', 
                    'forms_inserted_count' => $user->forms_inserted_count,
                    'audited_count' => $user->audited_count,
                    'changed_count' => $user->changed_count,
                    'accuracy' => $accuracy,
                    'speed' => [
                        'fastest' => round($user->training_records_min_fill_duration, 2),
                        'slowest' => round($user->training_records_max_fill_duration, 2),
                        'average' => round($user->training_records_avg_fill_duration, 2),
                    ]
                ];
            });

        return response()->json($users);
    }

    /**
     * Get all training records inserted by a specific user.
     */
    public function showUserRecords(Request $request, User $user): JsonResponse
    {
        $eventId = $request->query('event_id');
        
        $query = TrainingRecord::where('user_id', $user->id);
        
        if ($eventId) {
            $query->where('event_id', $eventId);
        }

        $records = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'records' => $records
        ]);
    }

    /**
     * Audit a specific training record.
     */
    public function auditRecord(Request $request, TrainingRecord $record): JsonResponse
    {
        $validated = $request->validate([
            'formID'        => 'nullable|string',
            'badgeID'       => 'nullable|string',
            'visitorName'   => 'nullable|string|max:255',
            'midleName'     => 'nullable|string|max:255',
            'surName'       => 'nullable|string|max:255',
            'organisation'  => 'nullable|string|max:255',
            'email'         => 'nullable|email|max:255',
            'phone1'        => 'nullable|string|max:30',
            'phone2'        => 'nullable|string|max:30',
            'gender'        => 'nullable|string|max:20',
            'nationality'   => 'nullable|string|max:100',
            'resident'      => 'nullable|string|max:100',
            'workfield'     => 'nullable|array',
            'howexpo'       => 'nullable|array',
            'audit_changed' => 'required|boolean',
        ]);

        $auditChanged = $validated['audit_changed'];
        unset($validated['audit_changed']);

        // Update the record with the new data
        $record->fill($validated);
        $record->is_audited = true;
        
        // Ensure audit_changed is true if the auditor says so, 
        // or we could calculate it manually but the frontend is better at knowing if it changed anything
        $record->audit_changed = $auditChanged;

        $record->save();

        return response()->json([
            'message' => 'Record audited successfully',
            'record' => $record
        ]);
    }
}
