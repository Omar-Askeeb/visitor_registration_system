<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$count = \DB::table('visitors')->where('visitor_source', 'online')->where('print_count', '>', 0)->count();
$withDate = \DB::table('visitors')->where('visitor_source', 'online')->where('print_count', '>', 0)->whereNotNull('print_date')->count();
$dates = \DB::table('visitors')
    ->where('visitor_source', 'online')
    ->where('print_count', '>', 0)
    ->select(\DB::raw('DATE(print_date) as d'), \DB::raw('count(*) as c'))
    ->groupBy('d')
    ->get();

echo "Total Online Attended: $count\n";
echo "With print_date: $withDate\n";
echo "Date Breakdown:\n";
foreach ($dates as $row) {
    echo "Date: " . ($row->d ?? 'NULL') . " | Count: " . $row->c . "\n";
}
