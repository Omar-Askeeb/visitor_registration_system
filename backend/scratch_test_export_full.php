<?php
$event = App\Models\Event::first();
if (!$event) { echo "No event found.\n"; exit; }
$request = new \Illuminate\Http\Request([
    'type' => 'all',
    'format' => 'csv',
    'columns' => ['formID', 'badgeID', 'visitorName', 'midleName', 'surName', 'organisation', 'email', 'phone1', 'phone2', 'gender', 'nationality', 'resident', 'workfield', 'howexpo']
]);
$controller = app()->make(App\Http\Controllers\ExportController::class);
try {
    $response = $controller->exportVisitors($request, $event);
    echo "Status: " . $response->getStatusCode() . "\n";
    if ($response instanceof \Symfony\Component\HttpFoundation\StreamedResponse) {
        ob_start();
        $response->sendContent();
        $content = ob_get_clean();
        echo "Streamed Content Length: " . strlen($content) . "\n";
    }
} catch (\Throwable $e) {
    echo "Exception: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine() . "\n";
}
