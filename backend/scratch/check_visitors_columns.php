<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$columns = \Illuminate\Support\Facades\Schema::getColumnListing('visitors');
echo "Columns: " . implode(', ', $columns) . "\n";

if (in_array('has_whatsapp', $columns)) {
    echo "has_whatsapp exists.\n";
} else {
    echo "has_whatsapp is MISSING.\n";
}
