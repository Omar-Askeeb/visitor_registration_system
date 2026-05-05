<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

foreach(\App\Models\User::with('role.permissions')->get() as $u) {
    echo "ID: {$u->id}, Name: {$u->name}, Role: {$u->role?->name}\n";
    if ($u->role) {
        echo "  Permissions: " . $u->role->permissions->pluck('name')->implode(', ') . "\n";
    }
}
