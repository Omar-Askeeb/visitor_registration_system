<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    \App\Models\Scan::create([
        'barcode' => 'test-badge-' . time(),
        'timestamp' => now(),
        'gate_details' => 'Auto-Recovered',
        'event_id' => 1,
        'flag' => 'test'
    ]);
    echo "Success\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
