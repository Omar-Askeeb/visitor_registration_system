<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$perms = \DB::table('role_permission')
    ->where('role_id', 5)
    ->join('permissions', 'permission_id', '=', 'permissions.id')
    ->select('permissions.name')
    ->get();
echo json_encode($perms, JSON_PRETTY_PRINT);
