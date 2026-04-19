<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Event;
use App\Models\SyncLog;
use Illuminate\Support\Facades\Http;

echo "--- Events ---\n";
$events = Event::all();
foreach ($events as $event) {
    echo "ID: {$event->id}, Name: {$event->name}, Sync Enabled: " . ($event->sync_enabled ? 'YES' : 'NO') . ", Slug: {$event->online_slug}, URL: {$event->sync_url}\n";
}

echo "\n--- Last 5 Sync Logs ---\n";
$logs = SyncLog::orderBy('created_at', 'desc')->limit(5)->get();
foreach ($logs as $log) {
    echo "ID: {$log->id}, Event ID: {$log->event_id}, Status: {$log->status}, Fetched: {$log->records_fetched}, Added: {$log->records_added}, Error: {$log->error_message}, Created: {$log->created_at}\n";
}

echo "\n--- API Test (with from_date) ---\n";
$event = Event::find(1);
if ($event) {
    $fromDate = '2026-04-01'; // Try an older date to see if we get more records
    $url = $event->sync_url ?: "https://eventxcrm.com/api/get-visitors/{$event->online_slug}";
    echo "Testing URL: $url with from_date=$fromDate\n";
    try {
        $response = Http::get($url, ['from_date' => $fromDate, 'per_page' => 100]);
        echo "Response Status: " . $response->status() . "\n";
        if ($response->successful()) {
            $data = $response->json();
            echo "Data entries found: " . count($data['data'] ?? []) . "\n";
            echo "Total records reported: " . ($data['pagination']['total'] ?? 'N/A') . "\n";
            echo "Current Page: " . ($data['pagination']['current_page'] ?? 'N/A') . "\n";
            echo "Total Pages: " . ($data['pagination']['total_pages'] ?? 'N/A') . "\n";
        } else {
            echo "Response Body: " . $response->body() . "\n";
        }
    } catch (\Exception $e) {
        echo "API Error: " . $e->getMessage() . "\n";
    }
}

