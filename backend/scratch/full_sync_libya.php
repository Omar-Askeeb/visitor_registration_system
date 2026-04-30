<?php
/**
 * Manual Full Sync Script - Libya Build 2026
 * Brute-force sync ignoring incremental logs.
 */

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Event;
use App\Models\Visitor;
use App\Models\SyncLog;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

$eventID = 1;
$event = Event::find($eventID);

if (!$event) {
    die("Event with ID $eventID not found.\n");
}

echo "Starting Full Sync for Event: {$event->name}\n";
echo "Sync URL: " . ($event->sync_url ?: "https://eventxcrm.com/api/get-visitors/{$event->online_slug}") . "\n";

$page = 1;
$perPage = 500;
$totalFetched = 0;
$totalAdded = 0;
$totalSkipped = 0;

// Force fromDate to null or empty to get all records
$fromDate = null; 

do {
    $url = $event->sync_url ?: "https://eventxcrm.com/api/get-visitors/{$event->online_slug}";
    
    // Replace placeholders if any
    $placeholders = [
        '{slug}' => $event->online_slug,
        '{page}' => $page,
        '{per_page}' => $perPage,
        '{from_date}' => $fromDate ?: '',
    ];
    $finalUrl = str_replace(array_keys($placeholders), array_values($placeholders), $url);
    
    // Params
    $params = [];
    if (!str_contains($url, '{per_page}')) $params['per_page'] = $perPage;
    if (!str_contains($url, '{page}'))     $params['page'] = $page;
    if (!str_contains($url, '{from_date}') && $fromDate) $params['from_date'] = $fromDate;

    echo "Fetching Page $page ... ";
    $response = Http::get($finalUrl, $params);

    if (!$response->successful()) {
        echo "FAILED\n";
        echo "API request failed: " . $response->body() . "\n";
        break;
    }

    $jsonData = $response->json();
    $visitorsData = $jsonData['data'] ?? [];
    $pagination = $jsonData['pagination'] ?? [];
    $totalPages = $pagination['total_pages'] ?? 1;
    $totalRecords = $pagination['total'] ?? 0;

    echo "Found " . count($visitorsData) . " records (Total: $totalRecords)\n";

    if (empty($visitorsData)) {
        break;
    }

    foreach ($visitorsData as $data) {
        $totalFetched++;

        // Check if already exists by onlineRegID (reference_code)
        $exists = Visitor::where('onlineRegID', $data['reference_code'])->exists();
        if ($exists) {
            $totalSkipped++;
            continue;
        }

        // Create new visitor using the logic from SyncVisitors.php
        createVisitor($event, $data);
        $totalAdded++;
        
        if ($totalAdded % 50 == 0) {
            echo ".";
        }
    }
    echo "\n";

    $page++;
} while ($page <= $totalPages);

echo "\n--- Sync Summary ---\n";
echo "Total Fetched: $totalFetched\n";
echo "Total Already Existed: $totalSkipped\n";
echo "Total Added: $totalAdded\n";
echo "Sync Completed at: " . date('Y-m-d H:i:s') . "\n";

// Log the success if needed (comment out if you don't want to affect system logs)
SyncLog::create([
    'event_id' => $event->id,
    'status' => 'success',
    'records_fetched' => $totalFetched,
    'records_added' => $totalAdded,
    'last_sync_date' => now(),
    'error_message' => 'Manual full sync triggered via script.',
]);

function createVisitor($event, array $data) {
    if (!isset($data['reference_code'])) return;

    $prefix = $event->online_reg_prefix ?: 'O';
    
    // Find next formID iteration
    $onlineLength = strlen($prefix) + 4;
    $lastVisitor = Visitor::where('event_id', $event->id)
        ->where('formID', 'like', $prefix . '%')
        ->whereRaw('CHAR_LENGTH(formID) = ?', [$onlineLength])
        ->orderByRaw('CAST(SUBSTRING(formID, ?) AS UNSIGNED) DESC', [strlen($prefix) + 1])
        ->first();

    $iteration = 1;
    if ($lastVisitor) {
        $lastNum = substr($lastVisitor->formID, strlen($prefix));
        if (is_numeric($lastNum)) {
            $iteration = (int)$lastNum + 1;
        }
    }

    $formID = $prefix . str_pad($iteration, 4, '0', STR_PAD_LEFT);

    // Generate badgeID
    $bPrefix = $event->badge_id_prefix ?: 'B';
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
        'visitorName' => $data['first_name'] ?? '',
        'surName' => $data['last_name'] ?? '',
        'organisation' => $data['company_name'] ?? '',
        'email' => $data['email'] ?? '',
        'phone1' => $data['mobile_number'] ?? '',
        'phone2' => $data['phone_number'] ?? '',
        'resident' => $data['city'] ?? '',
        'nationality' => $data['country'] ?? '',
        'workfield' => isset($data['sectors']) ? array_map('trim', explode(',', $data['sectors'])) : [],
        'howexpo' => isset($data['marketing']) ? array_map('trim', explode(',', $data['marketing'])) : [],
        'online_source' => $data['source'] ?? '',
        'online_created_at' => isset($data['created_at']) ? Carbon::parse($data['created_at']) : now(),
    ]);
}
