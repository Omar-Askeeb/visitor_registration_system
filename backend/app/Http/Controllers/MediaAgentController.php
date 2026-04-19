<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\MediaAgent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MediaAgentController extends Controller
{
    /**
     * Search media agents for an event.
     */
    public function search(Request $request, Event $event): JsonResponse
    {
        $q = $request->query('q', '');
        if (strlen($q) < 1) return response()->json([]);

        $agents = $event->mediaAgents()
            ->where(function ($query) use ($q) {
                $query->where('first_name', 'like', "%{$q}%")
                      ->orWhere('last_name', 'like', "%{$q}%")
                      ->orWhere('organisation', 'like', "%{$q}%")
                      ->orWhere('phone1', 'like', "%{$q}%")
                      ->orWhere('badgeID', 'like', "%{$q}%");
            })
            ->limit(20)
            ->get();

        return response()->json($agents);
    }

    /**
     * Increment print count for a media agent.
     */
    public function incrementPrintCount(Event $event, MediaAgent $mediaAgent): JsonResponse
    {
        $mediaAgent->increment('print_count');
        return response()->json(['print_count' => $mediaAgent->print_count]);
    }

    /**
     * Store a new media agent.
     */
    public function store(Request $request, Event $event): JsonResponse
    {
        $validated = $request->validate([
            'first_name'   => 'required|string|max:255',
            'last_name'    => 'required|string|max:255',
            'position'     => 'nullable|string|max:255',
            'organisation' => 'required|string|max:255',
            'email'        => 'nullable|email|max:255',
            'phone1'       => 'required|string|max:30',
            'has_whatsapp' => 'boolean',
            'phone2'       => 'nullable|string|max:30',
            'gender'       => 'nullable|string|max:20',
            'nationality'  => 'nullable|string|max:100',
            'resident'     => 'nullable|string|max:100',
            'print_count'  => 'nullable|integer',
        ]);


        $validated['event_id'] = $event->id;
        
        // Auto-generate a badgeID for internal tracking
        $validated['badgeID'] = $this->generateNextBadgeId($event);

        $agent = MediaAgent::create($validated);

        return response()->json($agent, 201);
    }

    /**
     * Update an existing media agent.
     */
    public function update(Request $request, Event $event, MediaAgent $mediaAgent): JsonResponse
    {
        $validated = $request->validate([
            'first_name'   => 'required|string|max:255',
            'last_name'    => 'required|string|max:255',
            'position'     => 'nullable|string|max:255',
            'organisation' => 'required|string|max:255',
            'email'        => 'nullable|email|max:255',
            'phone1'       => 'required|string|max:30',
            'has_whatsapp' => 'boolean',
            'phone2'       => 'nullable|string|max:30',
            'gender'       => 'nullable|string|max:20',
            'nationality'  => 'nullable|string|max:100',
            'resident'     => 'nullable|string|max:100',
        ]);

        $mediaAgent->update($validated);

        return response()->json($mediaAgent);
    }


    /**
     * Get next badge ID for media agents (internal use).
     */
    private function generateNextBadgeId(Event $event): string
    {
        // We use a "MED-" prefix for media agents to distinguish them
        $prefix = 'MED-';
        $last = MediaAgent::where('event_id', $event->id)
            ->where('badgeID', 'like', $prefix . '%')
            ->orderByRaw('CAST(SUBSTRING(badgeID, 5) AS UNSIGNED) DESC')
            ->value('badgeID');

        $nextNum = 1;
        if ($last) {
            $suffix = substr($last, 4);
            $nextNum = ((int) $suffix) + 1;
        }

        return $prefix . str_pad($nextNum, 5, '0', STR_PAD_LEFT);
    }
}
