<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $eventId = $request->query('event_id');

        $eventsQuery = Event::withCount('visitors');
        if ($eventId && $eventId !== 'all') {
            $eventsQuery->where('id', $eventId);
        }
        $events = $eventsQuery->get();

        $stats = $events->map(function (Event $event) {
            // ... (keep the same logic inside map, but it now only runs for filtered events)
            $dailyStatsDB = $event->scans()
                ->select(DB::raw('DATE(timestamp) as scan_date'), DB::raw('count(distinct barcode) as unique_count'), DB::raw('count(*) as raw_count'))
                ->groupBy('scan_date')
                ->orderBy('scan_date')
                ->get()
                ->keyBy('scan_date');

            // Source-based daily registration breakdown
            // For 'online' visitors, we use print_date as a proxy for "attendance date"
            // For 'onsite' and 'self-service', we use created_at as they register and attend simultaneously
            $dailySourceBreakdown = $event->visitors()
                ->select(
                    DB::raw("DATE(CASE WHEN visitor_source = 'online' THEN print_date ELSE created_at END) as activity_date"),
                    DB::raw("SUM(CASE WHEN visitor_source = 'online' AND print_count > 0 THEN 1 ELSE 0 END) as online_attended"),
                    DB::raw("SUM(CASE WHEN visitor_source = 'onsite' THEN 1 ELSE 0 END) as onsite_count"),
                    DB::raw("SUM(CASE WHEN visitor_source = 'self-service' THEN 1 ELSE 0 END) as self_service_count")
                )
                ->whereNotNull(DB::raw("CASE WHEN visitor_source = 'online' THEN print_date ELSE created_at END"))
                ->groupBy('activity_date')
                ->orderBy('activity_date')
                ->get()
                ->keyBy('activity_date');

            $paddedDailyStats = [];
            if ($event->start_date && $event->end_date) {
                $period = \Carbon\CarbonPeriod::create(\Carbon\Carbon::parse($event->start_date), \Carbon\Carbon::parse($event->end_date));
                foreach ($period as $date) {
                    $dateString = $date->format('Y-m-d');
                    $src = $dailySourceBreakdown[$dateString] ?? null;
                    if (isset($dailyStatsDB[$dateString])) {
                        $paddedDailyStats[] = [
                            'scan_date'        => $dateString,
                            'unique_count'     => $dailyStatsDB[$dateString]->unique_count,
                            'raw_count'        => $dailyStatsDB[$dateString]->raw_count,
                            'online_attended'  => $src->online_attended ?? 0,
                            'onsite_count'     => $src->onsite_count ?? 0,
                            'self_service_count' => $src->self_service_count ?? 0,
                        ];
                    } else {
                        $paddedDailyStats[] = [
                            'scan_date'        => $dateString,
                            'unique_count'     => 0,
                            'raw_count'        => 0,
                            'online_attended'  => $src->online_attended ?? 0,
                            'onsite_count'     => $src->onsite_count ?? 0,
                            'self_service_count' => $src->self_service_count ?? 0,
                        ];
                    }
                }
            } else {
                $paddedDailyStats = $dailyStatsDB->values()->toArray();
            }

            $totalAttendance = collect($paddedDailyStats)->sum('unique_count');

            $redundantCount = DB::table('scans')
                ->where('event_id', $event->id)
                ->select('barcode')
                ->groupBy('barcode')
                ->having(DB::raw('count(distinct DATE(timestamp))'), '>', 1)
                ->count();

            $syncedCount = $event->visitors()->whereNotNull('onlineRegID')->count();
            $todaySyncedCount = $event->visitors()
                ->whereNotNull('onlineRegID')
                ->whereDate('created_at', now()->toDateString())
                ->count();

            // Total source-based counts
            $onlineAttendedCount = $event->visitors()
                ->where('visitor_source', 'online')
                ->where('print_count', '>', 0)
                ->count();

            $onsiteCount = $event->visitors()
                ->where('visitor_source', 'onsite')
                ->count();

            $selfServiceCount = $event->visitors()
                ->where('visitor_source', 'self-service')
                ->count();

            $kioskPrintCount = $event->visitors()
                ->whereHas('printer', function ($q) {
                    $q->where('role_id', 4); // self_service_device
                })
                ->count();

            return [
                'id'                   => $event->id,
                'name'                 => $event->name,
                'registered_count'     => $event->visitors_count,
                'synced_count'         => $syncedCount,
                'today_synced_count'   => $todaySyncedCount,
                'target_visitors'      => $event->target_visitors,
                'status'               => $event->status,
                'start_date'           => $event->start_date,
                'end_date'             => $event->end_date,
                'daily_stats'          => $paddedDailyStats,
                'total_attendance'     => $totalAttendance,
                'redundant_visits'     => $redundantCount,
                'online_attended'      => $onlineAttendedCount,
                'onsite_count'         => $onsiteCount,
                'self_service_count'   => $selfServiceCount,
                'kiosk_print_count'    => $kioskPrintCount,
            ];
        });

        // Get Top 3 Personnel filtered by event if provided
        $topPersonnel = User::with('role')
            ->withCount([
                'visitorsCreated' => function ($query) use ($eventId) {
                    if ($eventId && $eventId !== 'all') $query->where('event_id', $eventId);
                },
                'verifiedRecords' => function ($query) use ($eventId) {
                    if ($eventId && $eventId !== 'all') $query->where('event_id', $eventId);
                }
            ])
            ->orderByRaw('(visitors_created_count + verified_records_count) DESC')
            ->limit(3)
            ->get();

        $emailQuery = \App\Models\Visitor::query();
        if ($eventId && $eventId !== 'all') {
            $emailQuery->where('event_id', $eventId);
        }

        return response()->json([
            'events' => $stats,
            'all_events' => Event::all(['id', 'name']), // Provide full list for filters
            'totals' => [
                'registered_count'  => $stats->sum('registered_count'),
                'target_visitors'   => $stats->sum('target_visitors'),
                'total_attendance'  => $stats->sum('total_attendance'),
                'kiosk_print_count' => $stats->sum('kiosk_print_count'),
                'emails_sent'       => (clone $emailQuery)->where('email_send_status', 'sent')->count(),
                'emails_failed'     => (clone $emailQuery)->where('email_send_status', 'failed')->count(),
                'emails_pending'    => (clone $emailQuery)->where(fn($q) => $q->whereNull('email_send_status')->orWhere('email_send_status', 'pending'))->whereNotNull('email')->count(),
            ],

            'top_personnel' => $topPersonnel->map(fn($u) => [
                'id'      => $u->id,
                'name'    => $u->name,
                'role'    => $u->role?->display_name ?? 'Personnel',
                'actions' => $u->visitors_created_count + $u->verified_records_count,
            ]),
        ]);
    }
}
