<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Visitor;
use App\Models\ActivityLog;
use App\Jobs\RegisterVisitorExternalJob;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\UniqueConstraintViolationException;


class VisitorController extends Controller
{
    /**
     * List visitors for an event with advanced filtering.
     */
    public function index(Request $request, Event $event): JsonResponse
    {
        $query = $event->visitors()
            ->with(['creator:id,name,role_id', 'creator.role:id,name', 'modifiedBy:id,name', 'verifiedBy:id,name', 'printer:id,name']);

        // Filtering by personnel (creator)
        if ($request->has('creator_id')) {
            $query->where('creator_id', $request->creator_id);
        }

        // Filtering by auditor (verified_by)
        if ($request->has('verified_by_id')) {
            $query->where('verified_by_id', $request->verified_by_id);
        }

        // Filtering by quality (records that needed fixing)
        if ($request->has('needs_fixing')) {
            $query->where('verification_type', 'fixed');
        }

        // Filter by verification status
        if ($request->has('status')) {
            if ($request->status === 'verified') {
                $query->where('is_verified', true);
            } elseif ($request->status === 'pending') {
                $query->where('is_verified', false);
            }
        }

        $visitors = $query->latest()->paginate($request->query('per_page', 50));
        return response()->json($visitors);
    }

    /**
     * Check if a formID is already used for this event.
     */
    public function checkFormId(Request $request, Event $event): JsonResponse
    {
        $formID = $request->query('formID', '');
        $visitor = $event->visitors()
            ->with(['creator:id,name'])
            ->where('formID', $formID)
            ->first();

        return response()->json([
            'exists'  => $visitor !== null,
            'visitor' => $visitor,
        ]);
    }

    /**
     * Get the next available badge ID for this event.
     */
    public function nextBadgeId(Event $event): JsonResponse
    {
        return response()->json($this->generateNextBadgeIdData($event));
    }

    /**
     * Logic to generate the next available badge ID data.
     */
    private function generateNextBadgeIdData(Event $event): array
    {
        $prefix = $event->badge_id_prefix;
        
        // Get the latest badge ID for this event that starts with the prefix
        $last = $event->visitors()
            ->whereNotNull('badgeID')
            ->where('badgeID', 'like', $prefix . '%')
            ->orderByRaw('LENGTH(badgeID) DESC, badgeID DESC')
            ->value('badgeID');

        // If the whole ID is numeric (common for long sequences), we treat it as a single number to allow overflow/carry
        if ($last && is_numeric($last)) {
            // Use bcadd if available, else standard addition
            $next = function_exists('bcadd') ? bcadd($last, '1') : (string)((float)$last + 1);
            return [
                'badgeID' => $next,
                'nextNum' => 0,
            ];
        }

        // Traditional prefix + suffix logic for alphanumeric IDs (e.g., LB-00001)
        $nextNum = 1;
        if ($last) {
            $suffix  = substr($last, strlen($prefix));
            $nextNum = (is_numeric($suffix) ? (int)$suffix : 0) + 1;
        }

        return [
            'badgeID' => $prefix . str_pad($nextNum, 5, '0', STR_PAD_LEFT),
            'nextNum' => $nextNum,
        ];
    }


    /**
     * Search visitors for an event.
     */
    public function search(Request $request, Event $event): JsonResponse
    {
        $q = $request->query('q', '');
        if (strlen($q) < 1) return response()->json([]);

        // Improvement: If the query is a long numeric string, try an exact match first
        // to avoid "prefix pollution" from debounced searches.
        $exactMatch = null;
        if (is_numeric($q) && strlen($q) > 8) {
            $exactMatch = $event->visitors()
                ->where(function ($query) use ($q) {
                    $query->where('formID', $q)
                          ->orWhere('onlineRegID', $q);
                })
                ->with(['creator:id,name', 'modifiedBy:id,name', 'verifiedBy:id,name', 'printer:id,name'])
                ->first();
        }

        // If we found an exact match for a long ID, return it immediately to avoid confusion
        if ($exactMatch) {
            return response()->json([$exactMatch]);
        }

        $visitors = $event->visitors()
            ->where(function ($query) use ($q) {
                $query->where('visitorName',  'like', "%{$q}%")
                      ->orWhere('surName',     'like', "%{$q}%")
                      ->orWhere('email',       'like', "%{$q}%")
                      ->orWhere('phone1',      'like', "%{$q}%")
                      ->orWhere('phone2',      'like', "%{$q}%")
                      ->orWhere('formID',      'like', "%{$q}%")
                      ->orWhere('onlineRegID', 'like', "%{$q}%");
            })
            ->with(['creator:id,name', 'modifiedBy:id,name', 'verifiedBy:id,name', 'printer:id,name'])
            ->limit(20)
            ->get();

        return response()->json($visitors);
    }

    /**
     * Store a new visitor registration.
     */
    public function store(Request $request, Event $event): JsonResponse
    {
        $validated = $request->validate([
            'formID'       => 'required|string|unique:visitors,formID,NULL,id,event_id,' . $event->id,
            'badgeID'      => 'nullable|string',
            'onlineRegID'  => 'nullable|string',
            'visitorName'  => 'nullable|string|max:255',
            'midleName'    => 'nullable|string|max:255',
            'surName'      => 'nullable|string|max:255',
            'organisation' => 'nullable|string|max:255',
            'email'        => 'nullable|email|max:255',
            'phone1'       => 'nullable|string|max:30',
            'has_whatsapp' => 'nullable|integer',
            'phone2'       => 'nullable|string|max:30',
            'gender'       => 'nullable|string|max:20',
            'nationality'  => 'nullable|string|max:100',
            'resident'     => 'nullable|string|max:100',
            'workfield'    => 'nullable|array',
            'howexpo'      => 'nullable|array',
            'print_count'  => 'nullable|integer',
        ]);

        $validated['event_id']    = $event->id;
        $validated['insertUnits'] = 1;
        $validated['creator_id']  = auth()->id();
        $validated['modifier']    = auth()->id();

        // Determine source categorization
        if (!empty($validated['onlineRegID'])) {
            $validated['online_source']  = 'online';
            $validated['visitor_source'] = 'online';
        } else {
            $user = auth()->user()->load('role');
            if ($user->role && $user->role->name === 'self_service_device') {
                $validated['online_source']  = 'self_register';
                $validated['visitor_source'] = 'self-service';
            } else {
                $validated['online_source']  = 'onsite';
                $validated['visitor_source'] = 'onsite';
            }
        }

        // Auto-stamp print_date when a new visitor is saved+printed in one step
        if (!empty($validated['print_count']) && $validated['print_count'] > 0) {
            $validated['print_date'] = now();
            $validated['printed_by'] = auth()->id();
        }

        $maxRetries = 3;
        $visitor = null;

        for ($i = 0; $i < $maxRetries; $i++) {
            try {
                // If badgeID is null or empty, generate one
                if (empty($validated['badgeID'])) {
                    $badgeData = $this->generateNextBadgeIdData($event);
                    $validated['badgeID'] = $badgeData['badgeID'];
                }

                $visitor = Visitor::create($validated);
                break; // Success!
            } catch (UniqueConstraintViolationException $e) {
                // If it's a badgeID collision, clear it and retry with a fresh one
                // Check if the error message contains 'badgeID' or just retry and let the next loop iteration generate a fresh one
                if ($i === $maxRetries - 1) throw $e;

                // Reset badgeID to force re-generation in next iteration
                $validated['badgeID'] = null;
                
                // Optional: small delay to avoid immediate lock contention
                usleep(50000); // 50ms
            }
        }

        ActivityLog::create([
            'user_id'     => auth()->id(),
            'action'      => 'create_visitor',
            'description' => 'تسجيل زائر جديد: ' . ($validated['visitorName'] ?? '') . ' [' . ($validated['badgeID'] ?? '') . ']',
            'ip_address'  => request()->ip(),
        ]);

        return response()->json($visitor, 201);
    }


    /**
     * Update an existing visitor.
     */
    public function update(Request $request, Event $event, Visitor $visitor): JsonResponse
    {
        $validated = $request->validate([
            'badgeID'      => 'nullable|string',
            'visitorName'  => 'nullable|string|max:255',
            'midleName'    => 'nullable|string|max:255',
            'surName'      => 'nullable|string|max:255',
            'organisation' => 'nullable|string|max:255',
            'email'        => 'nullable|email|max:255',
            'phone1'       => 'nullable|string|max:30',
            'has_whatsapp' => 'nullable|integer',
            'phone2'       => 'nullable|string|max:30',
            'gender'       => 'nullable|string|max:20',
            'nationality'  => 'nullable|string|max:100',
            'resident'     => 'nullable|string|max:100',
            'workfield'    => 'nullable|array',
            'howexpo'      => 'nullable|array',
            'print_count'  => 'nullable|integer',
            // Audit fields if updating via review
            'is_verified'        => 'nullable|boolean',
            'verification_notes' => 'nullable|string',
        ]);

        $validated['modifier']    = auth()->id();
        $validated['modifydate']  = now();
        $validated['modifyCount'] = $visitor->modifyCount + 1;

        // Auto-stamp print_date on first print
        if (
            isset($validated['print_count']) &&
            $validated['print_count'] > ($visitor->print_count ?? 0) &&
            is_null($visitor->print_date)
        ) {
            $validated['print_date'] = now();
            $validated['printed_by'] = auth()->id();
        }

        // If Auditor/Admin is updating, flag as 'fixed' and mark verified if requested
        if (auth()->user()->role !== 'data_entry') {
            $validated['verification_type'] = 'fixed';
            if ($request->boolean('is_verified')) {
                $validated['is_verified'] = true;
                $validated['verified_by_id'] = auth()->id();
            }
        }

        $visitor->update($validated);

        ActivityLog::create([
            'user_id'     => auth()->id(),
            'action'      => 'update_visitor',
            'description' => 'تحديث بيانات زائر: ' . $visitor->visitorName . ' [' . $visitor->formID . ']',
            'ip_address'  => request()->ip(),
        ]);

        return response()->json($visitor);
    }

    /**
     * Verify a visitor (Audit).
     */
    public function verify(Request $request, Event $event, Visitor $visitor): JsonResponse
    {
        $visitor->update([
            'is_verified'       => true,
            'verified_by_id'    => auth()->id(),
            'verification_type' => $request->query('type', 'direct'), // 'direct' or 'fixed'
            'verification_notes' => $request->query('notes'),
        ]);

        return response()->json($visitor);
    }

    /**
     * Batch verify multiple visitors.
     */
    public function batchVerify(Request $request, Event $event): JsonResponse
    {
        $ids = $request->input('ids', []);
        Visitor::whereIn('id', $ids)->update([
            'is_verified'       => true,
            'verified_by_id'    => auth()->id(),
            'verification_type' => 'direct',
        ]);

        return response()->json(['message' => count($ids) . ' records verified.']);
    }

    /**
     * Count visitors not yet successfully synced to the external CRM.
     */
    public function unsyncedCount(Event $event): JsonResponse
    {
        $count = $event->visitors()
            ->whereNull('onlineRegID')
            ->where(function ($q) {
                // Only count records that are actually waiting to be synced
                // ('null' means never tried, 'pending' means currently in queue)
                $q->whereNull('external_sync_status')
                  ->orWhere('external_sync_status', 'pending');
            })
            ->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Re-queue CRM sync for all visitors of an event that failed or never synced.
     */
    public function resyncExternal(Event $event): JsonResponse
    {
        // Skip training events
        if ($event->is_training) {
            return response()->json(['message' => 'Training events are excluded from CRM sync.'], 422);
        }

        if (!$event->sync_push_enabled || !$event->sync_push_url) {
            return response()->json(['message' => 'Push Sync is disabled for this event.'], 400);
        }

        // Find all non-online visitors that haven't successfully synced
        $visitors = $event->visitors()
            ->whereIn('visitor_source', ['onsite', 'self-service']) 
            ->where(function ($q) {
                $q->whereNull('external_sync_status')
                  ->orWhere('external_sync_status', 'failed')
                  ->orWhere('external_sync_status', 'pending');
            })
            ->get();

        $count = $visitors->count();

        foreach ($visitors as $visitor) {
            // Reset to pending so we can track progress
            $visitor->update(['external_sync_status' => 'pending', 'external_sync_error' => null]);
            RegisterVisitorExternalJob::dispatch($visitor);
        }

        ActivityLog::create([
            'user_id'     => auth()->id(),
            'action'      => 'external_crm_resync',
            'description' => "🔄 Manual CRM Resync triggered for event [{$event->name}]: {$count} records queued.",
            'ip_address'  => request()->ip(),
        ]);

        return response()->json([
            'message' => "{$count} records queued for CRM sync.",
            'queued'  => $count,
        ]);
    }

    /**
     * Increment print count for a visitor.
     */
    public function incrementPrintCount(Event $event, Visitor $visitor): JsonResponse
    {
        $visitor->print_count += 1;
        if (is_null($visitor->print_date)) {
            $visitor->print_date = now();
        }
        // Always update who last printed the badge
        $visitor->printed_by = auth()->id();
        
        $visitor->save();
        
        return response()->json(['print_count' => $visitor->print_count]);
    }
}
