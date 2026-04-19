<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Database: " . \Illuminate\Support\Facades\DB::connection()->getDatabaseName() . "\n";
echo "Prefix: " . \Illuminate\Support\Facades\DB::connection()->getTablePrefix() . "\n";

try {
    $tables = \Illuminate\Support\Facades\DB::select('SHOW TABLES');
    echo "Tables in " . \Illuminate\Support\Facades\DB::connection()->getDatabaseName() . ":\n";
    foreach ($tables as $table) {
        echo "- " . current((array)$table) . "\n";
    }
    
    echo "--- Testing scans query ---\n";
    $result = \Illuminate\Support\Facades\DB::table('scans')->get();
    echo "Query successful, " . $result->count() . " rows.\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
