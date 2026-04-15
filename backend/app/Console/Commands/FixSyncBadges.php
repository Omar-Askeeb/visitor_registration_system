<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Event;
use App\Models\Visitor;

class FixSyncBadges extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sync:fix-badges';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Assign badge IDs to previously synced visitors who are missing them';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $events = Event::all();

        foreach ($events as $event) {
            $visitors = Visitor::where('event_id', $event->id)
                ->whereNotNull('onlineRegID')
                ->whereNull('badgeID')
                ->get();

            if ($visitors->isEmpty()) {
                continue;
            }

            $this->info("Fixing {$visitors->count()} visitors for event: {$event->name}");

            $prefix = $event->badge_id_prefix;
            
            // Find current max badge number for this event
            $lastBadge = Visitor::where('event_id', $event->id)
                ->whereNotNull('badgeID')
                ->where('badgeID', 'like', $prefix . '%')
                ->orderByRaw('CAST(SUBSTRING(badgeID, ?) AS UNSIGNED) DESC', [strlen($prefix) + 1])
                ->value('badgeID');

            $nextNum = 1;
            if ($lastBadge) {
                $suffix = substr($lastBadge, strlen($prefix));
                $nextNum = ((int) $suffix) + 1;
            }

            foreach ($visitors as $visitor) {
                $badgeID = $prefix . str_pad($nextNum, 5, '0', STR_PAD_LEFT);
                $visitor->update(['badgeID' => $badgeID]);
                $nextNum++;
            }

            $this->info("Successfully assigned badge IDs to {$visitors->count()} visitors.");
        }

        $this->info('Repair complete.');
    }
}
