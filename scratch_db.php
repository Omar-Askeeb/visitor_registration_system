<?php
require __DIR__ . '/backend/vendor/autoload.php';
$app = require_once __DIR__ . '/backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$scans = Illuminate\Support\Facades\DB::select('SELECT s.id, s.barcode, v.event_id FROM scans s JOIN visitors v ON s.barcode = v.badgeID WHERE s.event_id IS NULL LIMIT 5');
print_r($scans);
