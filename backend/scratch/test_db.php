<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    $count = \Illuminate\Support\Facades\DB::table('scans')->count();
    echo "Scans count: $count\n";
    
    $events = \App\Models\Event::all();
    echo "Events count: " . $events->count() . "\n";
    
    foreach ($events as $event) {
        echo "Event: {$event->name}, Visitors: " . $event->visitors()->count() . "\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
