<?php
$event = App\Models\Event::first();
if (!$event) { echo "No event found.\n"; exit; }
$request = new \Illuminate\Http\Request([
    'type' => 'all',
    'format' => 'csv',
    'columns' => ['formID', 'badgeID', 'visitorName', 'workfield']
]);
$controller = app()->make(App\Http\Controllers\ExportController::class);
$response = $controller->exportVisitors($request, $event);

echo "Status: " . $response->getStatusCode() . "\n";
if ($response instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
    ob_start();
    $response->sendContent();
    $content = ob_get_clean();
    echo "Content Length: " . strlen($content) . "\n";
    echo "Preview: " . substr($content, 0, 100) . "\n";
} else {
    echo "Content: " . $response->getContent() . "\n";
}
