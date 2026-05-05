<?php
$event = App\Models\Event::first();
if (!$event) { echo "No event found.\n"; exit; }
$request = new \Illuminate\Http\Request([
    'type' => 'all',
    'format' => 'sql',
    'columns' => ['formID', 'badgeID', 'visitorName', 'workfield']
]);
$controller = app()->make(App\Http\Controllers\ExportController::class);
try {
    $response = $controller->exportVisitors($request, $event);
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Preview: " . substr($response->getContent(), 0, 100) . "\n";
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
