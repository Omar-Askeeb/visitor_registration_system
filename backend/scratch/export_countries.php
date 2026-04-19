<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    $schema = DB::select('DESCRIBE v2_countries');
    echo "--- SCHEMA ---\n";
    echo json_encode($schema, JSON_PRETTY_PRINT) . "\n";

    $data = DB::table('countries')->get(); // Using DB::table with prefix config
    echo "\n--- DATA (Total: " . $data->count() . ") ---\n";
    echo json_encode($data->take(5), JSON_PRETTY_PRINT) . "\n"; // Sample data
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
