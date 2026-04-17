<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Event;
use App\Models\Visitor;
use App\Models\SyncLog;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class SyncVisitors extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sync:visitors {--event_id=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync visitors from external API';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $eventId = $this->option('event_id');
        $query = Event::where('sync_enabled', true);

        if ($eventId) {
            $query->where('id', $eventId);
        }

        $events = $query->get();

        if ($events->isEmpty()) {
            $this->info('No events found for sync.');
            return;
        }

        foreach ($events as $event) {
            $this->syncEvent($event);
        }
    }

    protected function syncEvent(Event $event)
    {
        $lockKey = 'sync_event_' . $event->id;
        $lock = Cache::lock($lockKey, 300); // 5 minute max lock

        if (!$lock->get()) {
            $this->warn("Skipping {$event->name}: Task already in progress (Locked).");
            return;
        }

        try {
            $this->info("Syncing event: {$event->name}");

            $lastLog = SyncLog::where('event_id', $event->id)
                ->where('status', 'success')
                ->orderBy('created_at', 'desc')
                ->first();

            // Precise Interval Check
            if ($lastLog) {
                $secondsSinceLast = $lastLog->created_at->diffInSeconds(now());
                $requiredSeconds = ($event->sync_interval * 60) - 5; // 5s grace for scheduling jitter

                if ($secondsSinceLast < $requiredSeconds) {
                    $this->info("Skipping {$event->name}: Interval ({$event->sync_interval}m) not reached ({$secondsSinceLast}s elapsed).");
                    return;
                }
            }

            $fromDate = $lastLog ? $lastLog->last_sync_date->format('Y-m-d') : '2026-04-01';
            $page = 1;
            $perPage = 500;
            $totalFetched = 0;
            $totalAdded = 0;

            do {
                $url = $event->sync_url ?: "https://eventxcrm.com/api/get-visitors/{$event->online_slug}";
                
                // Replace placeholders
                $placeholders = [
                    '{slug}' => $event->online_slug,
                    '{page}' => $page,
                    '{per_page}' => $perPage,
                    '{from_date}' => $fromDate,
                ];

                $finalUrl = str_replace(array_keys($placeholders), array_values($placeholders), $url);
                
                // Only append standard params if they aren't already placeholders in the URL
                $params = [];
                if (!str_contains($url, '{per_page}')) $params['per_page'] = $perPage;
                if (!str_contains($url, '{page}'))     $params['page'] = $page;
                if (!str_contains($url, '{from_date}')) $params['from_date'] = $fromDate;

                $response = Http::get($finalUrl, $params);

                if (!$response->successful()) {
                    throw new \Exception("API request failed: " . $response->body());
                }

                $jsonData = $response->json();
                $visitorsData = $jsonData['data'] ?? [];
                $pagination = $jsonData['pagination'] ?? [];
                $totalPages = $pagination['total_pages'] ?? 1;

                foreach ($visitorsData as $data) {
                    $totalFetched++;

                    // Check if already exists
                    $exists = Visitor::where('onlineRegID', $data['reference_code'])->exists();
                    if ($exists) {
                        continue;
                    }

                    // Create new visitor
                    $this->createVisitor($event, $data);
                    $totalAdded++;
                }

                $page++;
            } while ($page <= $totalPages);

            SyncLog::create([
                'event_id' => $event->id,
                'status' => 'success',
                'records_fetched' => $totalFetched,
                'records_added' => $totalAdded,
                'last_sync_date' => now(),
            ]);

            $this->info("Sync completed: Added {$totalAdded} new visitors.");

        } catch (\Exception $e) {
            $this->error("Sync failed for event {$event->name}: " . $e->getMessage());
            SyncLog::create([
                'event_id' => $event->id,
                'status' => 'failure',
                'error_message' => $e->getMessage(),
                'last_sync_date' => isset($fromDate) ? Carbon::parse($fromDate) : now(),
            ]);
        } finally {
            $lock->release();
        }
    }

    protected function createVisitor(Event $event, array $data)
    {
        $prefix = $event->online_reg_prefix;
        
        // Find next formID iteration
        $lastVisitor = Visitor::where('formID', 'like', $prefix . '%')
            ->orderBy('formID', 'desc')
            ->first();

        $iteration = 1;
        if ($lastVisitor) {
            $lastNum = substr($lastVisitor->formID, strlen($prefix));
            if (is_numeric($lastNum)) {
                $iteration = (int)$lastNum + 1;
            }
        }

        $formID = $prefix . str_pad($iteration, 5, '0', STR_PAD_LEFT);

        // --- Generate badgeID ---
        $bPrefix = $event->badge_id_prefix;
        $lastBadge = Visitor::where('event_id', $event->id)
            ->whereNotNull('badgeID')
            ->where('badgeID', 'like', $bPrefix . '%')
            ->orderByRaw('CAST(SUBSTRING(badgeID, ?) AS UNSIGNED) DESC', [strlen($bPrefix) + 1])
            ->value('badgeID');

        $bNextNum = 1;
        if ($lastBadge) {
            $bSuffix = substr($lastBadge, strlen($bPrefix));
            $bNextNum = ((int) $bSuffix) + 1;
        }
        $badgeID = $bPrefix . str_pad($bNextNum, 5, '0', STR_PAD_LEFT);

        Visitor::create([
            'event_id' => $event->id,
            'formID' => $formID,
            'badgeID' => $badgeID,
            'onlineRegID' => $data['reference_code'],
            'visitorName' => $data['first_name'],
            'surName' => $data['last_name'],
            'organisation' => $data['company_name'],
            'email' => $data['email'],
            'phone1' => $data['mobile_number'],
            'phone2' => $data['phone_number'],
            'resident' => $data['city'],
            'nationality' => $data['country'],
            'workfield' => $data['sectors'] ? array_map('trim', explode(',', $data['sectors'])) : [],
            'howexpo' => $data['marketing'] ? array_map('trim', explode(',', $data['marketing'])) : [],
            'online_source' => $data['source'],
            'online_created_at' => Carbon::parse($data['created_at']),
        ]);
    }
}
