<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class EventController extends Controller
{
    /**
     * List all events with visitor counts.
     */
    public function index(): JsonResponse
    {
        $events = Event::withCount('visitors')->orderBy('start_date', 'desc')->get();
        return response()->json($events);
    }

    /**
     * Store a new event.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'               => 'required|string|max:255',
            'location'           => 'nullable|string|max:255',
            'start_date'         => 'nullable|date',
            'end_date'           => 'nullable|date|after_or_equal:start_date',
            'duration'           => 'nullable|integer|min:1',
            'badge_id_prefix'    => 'required|string|max:20',
            'form_id_prefix'     => 'required|string|max:20',
            'online_reg_prefix'  => 'required|string|max:20',
            'target_visitors'    => 'nullable|integer|min:0',
            'status'             => 'nullable|in:upcoming,active,completed',
            'notes'              => 'nullable|string',
            'online_slug'        => 'nullable|string|max:255',
            'sync_enabled'       => 'nullable|boolean',
            'sync_url'           => 'nullable|string',
            'sync_interval'      => 'nullable|integer|min:1',
            'sync_countdown'     => 'nullable|integer|min:1',
            'workfield_options'  => 'nullable|array',
            'howexpo_options'    => 'nullable|array',
        ]);

        $event = Event::create($validated);
        $event->loadCount('visitors');

        ActivityLog::create([
            'user_id'     => auth()->id(),
            'action'      => 'create_event',
            'description' => 'إنشاء حدث جديد: ' . $event->name,
            'ip_address'  => request()->ip(),
        ]);

        return response()->json($event, 201);
    }

    /**
     * Show a single event.
     */
    public function show(Event $event): JsonResponse
    {
        $event->loadCount('visitors');
        return response()->json($event);
    }

    /**
     * Update an event.
     */
    public function update(Request $request, Event $event): JsonResponse
    {
        $validated = $request->validate([
            'name'               => 'sometimes|required|string|max:255',
            'location'           => 'nullable|string|max:255',
            'start_date'         => 'nullable|date',
            'end_date'           => 'nullable|date|after_or_equal:start_date',
            'duration'           => 'nullable|integer|min:1',
            'badge_id_prefix'    => 'sometimes|required|string|max:20',
            'form_id_prefix'     => 'sometimes|required|string|max:20',
            'online_reg_prefix'  => 'sometimes|required|string|max:20',
            'target_visitors'    => 'nullable|integer|min:0',
            'status'             => 'nullable|in:upcoming,active,completed',
            'notes'              => 'nullable|string',
            'online_slug'        => 'nullable|string|max:255',
            'sync_enabled'       => 'nullable|boolean',
            'sync_url'           => 'nullable|string',
            'sync_interval'      => 'nullable|integer|min:1',
            'sync_countdown'     => 'nullable|integer|min:1',
            'workfield_options'  => 'nullable|array',
            'howexpo_options'    => 'nullable|array',
        ]);

        $event->update($validated);
        $event->loadCount('visitors');

        ActivityLog::create([
            'user_id'     => auth()->id(),
            'action'      => 'update_event',
            'description' => 'تعديل بيانات حدث: ' . $event->name,
            'ip_address'  => request()->ip(),
        ]);

        return response()->json($event);
    }

    /**
     * Delete an event (and cascade-delete its visitors).
     */
    public function destroy(Event $event): JsonResponse
    {
        $eventName = $event->name;
        $event->delete();

        ActivityLog::create([
            'user_id'     => auth()->id(),
            'action'      => 'delete_event',
            'description' => 'حذف حدث: ' . $eventName,
            'ip_address'  => request()->ip(),
        ]);

        return response()->json(['message' => 'Event deleted successfully.']);
    }
}
