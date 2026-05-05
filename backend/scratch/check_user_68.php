<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = \DB::table('users')->where('id', 68)->first();
echo json_encode($user, JSON_PRETTY_PRINT);
