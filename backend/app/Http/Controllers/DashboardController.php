<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Event;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $events = Event::withCount('visitors')->get();

        $stats = $events->map(function (Event $event) {
            // Daily visitors (raw vs unique barcode per day)
            $dailyStatsDB = $event->scans()
                ->select(DB::raw('DATE(timestamp) as scan_date'), DB::raw('count(distinct barcode) as unique_count'), DB::raw('count(*) as raw_count'))
                ->groupBy('scan_date')
                ->orderBy('scan_date')
                ->get()
                ->keyBy('scan_date');

            // Generate padded daily stats from start_date to end_date
            $paddedDailyStats = [];
            if ($event->start_date && $event->end_date) {
                $period = \Carbon\CarbonPeriod::create(\Carbon\Carbon::parse($event->start_date), \Carbon\Carbon::parse($event->end_date));
                foreach ($period as $date) {
                    $dateString = $date->format('Y-m-d');
                    if (isset($dailyStatsDB[$dateString])) {
                        $paddedDailyStats[] = [
                            'scan_date' => $dateString,
                            'unique_count' => $dailyStatsDB[$dateString]->unique_count,
                            'raw_count' => $dailyStatsDB[$dateString]->raw_count,
                        ];
                    } else {
                        $paddedDailyStats[] = [
                            'scan_date' => $dateString,
                            'unique_count' => 0,
                            'raw_count' => 0,
                        ];
                    }
                }
            } else {
                $paddedDailyStats = $dailyStatsDB->values()->toArray();
            }

            // Total attendance: sum of unique daily visitors
            $totalAttendance = collect($paddedDailyStats)->sum('unique_count');

            // Unique visitors who returned for >1 distinct day
            $redundantCount = DB::table('scans')
                ->where('event_id', $event->id)
                ->select('barcode')
                ->groupBy('barcode')
                ->having(DB::raw('count(distinct DATE(timestamp))'), '>', 1)
                ->count();

            // Synced from API
            $syncedCount = $event->visitors()->whereNotNull('onlineRegID')->count();
            $todaySyncedCount = $event->visitors()
                ->whereNotNull('onlineRegID')
                ->whereDate('created_at', now()->toDateString())
                ->count();

            return [
                'id'                 => $event->id,
                'name'               => $event->name,
                'registered_count'   => $event->visitors_count,
                'synced_count'       => $syncedCount,
                'today_synced_count' => $todaySyncedCount,
                'target_visitors'    => $event->target_visitors,
                'status'             => $event->status,
                'start_date'         => $event->start_date,
                'end_date'           => $event->end_date,
                'daily_stats'        => $paddedDailyStats,
                'total_attendance'   => $totalAttendance,
                'redundant_visits'   => $redundantCount,
            ];
        });

        // Get Top 3 Personnel
        $topPersonnel = User::with('role')
            ->withCount(['visitorsCreated', 'verifiedRecords'])
            ->orderByRaw('(visitors_created_count + verified_records_count) DESC')
            ->limit(3)
            ->get();

        return response()->json([
            'events' => $stats,
            'totals' => [
                'registered_count'  => $events->sum('visitors_count'),
                'target_visitors'   => $events->sum('target_visitors'),
                'total_attendance'  => $stats->sum('total_attendance'),
                'emails_sent'       => \App\Models\Visitor::where('email_send_status', 'sent')->count(),
                'emails_failed'     => \App\Models\Visitor::where('email_send_status', 'failed')->count(),
                'emails_pending'    => \App\Models\Visitor::where(fn($q) => $q->whereNull('email_send_status')->orWhere('email_send_status', 'pending'))->whereNotNull('email')->count(),
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
