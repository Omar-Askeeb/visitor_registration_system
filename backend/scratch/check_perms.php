<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Permission;
use App\Models\Role;

echo "=== All Permissions ===\n";
foreach (Permission::all() as $p) {
    echo "  [{$p->id}] {$p->name}\n";
}

echo "\n=== All Roles & Their Permissions ===\n";
foreach (Role::with('permissions')->get() as $role) {
    $perms = $role->permissions->pluck('name')->implode(', ');
    echo "  [{$role->id}] {$role->name}: {$perms}\n";
}
