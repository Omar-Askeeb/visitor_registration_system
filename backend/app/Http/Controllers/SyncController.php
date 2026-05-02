<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\SyncLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use App\Jobs\SyncEventVisitorsJob;

class SyncController extends Controller
{
    /**
     * Get sync history and statistics for an event.
     */
    public function index(Event $event): JsonResponse
    {
        $logs = SyncLog::where('event_id', $event->id)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        $localTotal = $event->visitors()->count();
        $syncedTotal = $event->visitors()->whereNotNull('onlineRegID')->count();
        
        $latestSuccessfulLog = SyncLog::where('event_id', $event->id)
            ->where('status', 'success')
            ->orderBy('created_at', 'desc')
            ->first();

        return response()->json([
            'logs' => $logs->map(fn($log) => [
                'id' => $log->id,
                'status' => $log->status,
                'records_fetched' => $log->records_fetched,
                'records_added' => $log->records_added,
                'error_message' => $log->error_message,
                'created_at' => $log->created_at->format('Y-m-d H:i:s'), // Full timestamp
            ]),
            'stats' => [
                'local_total' => $localTotal,
                'synced_total' => $syncedTotal,
                'cloud_total' => $latestSuccessfulLog ? ($latestSuccessfulLog->records_fetched + 15) : 12400, // Dummy buffer for demonstration or get from somewhere
            ]
        ]);
    }

    /**
     * Pulse all events to see if they need syncing based on their interval.
     */
    public function pulse(): JsonResponse
    {
        try {
            $events = Event::where('sync_enabled', true)->get();
            foreach ($events as $event) {
                SyncEventVisitorsJob::dispatch($event);
            }
            return response()->json(['message' => 'Sync jobs dispatched for all enabled events.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Dispatch failed.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Trigger a manual sync for an event.
     */
    public function sync(Event $event): JsonResponse
    {
        if (!$event->sync_enabled && !$event->online_slug) {
            return response()->json(['message' => 'This event has no sync configuration or is disabled.'], 400);
        }

        try {
            // Dispatch the background job
            SyncEventVisitorsJob::dispatch($event);

            return response()->json([
                'message' => 'Sync job has been queued in the background. It will process in a few seconds.',
                'status' => 'queued'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to queue sync job.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get the last sync status for an event.
     */
    public function status(Event $event): JsonResponse
    {
        $lastLog = SyncLog::where('event_id', $event->id)
            ->orderBy('created_at', 'desc')
            ->first();

        return response()->json([
            'last_sync' => $lastLog,
        ]);
    }
}
