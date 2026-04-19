<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$tables = ['visitors', 'scans', 'countries'];
foreach ($tables as $table) {
    try {
        $columns = \Illuminate\Support\Facades\Schema::getColumnListing($table);
        echo "Columns for $table: " . implode(', ', $columns) . "\n";
    } catch (\Exception $e) {
        echo "Error checking $table: " . $e->getMessage() . "\n";
    }
}
