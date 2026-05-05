<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$role = \DB::table('roles')->where('id', 4)->first();
echo json_encode($role, JSON_PRETTY_PRINT);
