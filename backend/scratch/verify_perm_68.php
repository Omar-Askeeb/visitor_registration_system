<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = \App\Models\User::find(68);
echo "User: {$user->name} (ID: {$user->id})\n";
echo "Role: " . ($user->role?->name ?? 'NULL') . "\n";
echo "Has view_dashboard: " . ($user->hasPermission('view_dashboard') ? 'YES' : 'NO') . "\n";
