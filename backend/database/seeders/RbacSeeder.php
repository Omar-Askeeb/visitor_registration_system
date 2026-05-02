<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Permissions
        $permissions = [
            // Dashboard
            ['name' => 'view_dashboard', 'display_name' => 'View Dashboard', 'group' => 'Dashboard'],
            
            // Events
            ['name' => 'view_events', 'display_name' => 'View Events', 'group' => 'Events'],
            ['name' => 'manage_events', 'display_name' => 'Manage Events', 'group' => 'Events'],
            
            // Registration
            ['name' => 'register_visitors', 'display_name' => 'Register Visitors', 'group' => 'Registration'],
            ['name' => 'register_media', 'display_name' => 'Register Media', 'group' => 'Registration'],
            
            // Exhibitors
            ['name' => 'manage_exhibitors', 'display_name' => 'Manage Exhibitors', 'group' => 'Exhibitors'],
            
            // Printing
            ['name' => 'print_badges', 'display_name' => 'Print Badges', 'group' => 'Printing'],
            
            // Auditing & Review
            ['name' => 'audit_records', 'display_name' => 'Audit Records', 'group' => 'Auditing'],
            ['name' => 'review_queue', 'display_name' => 'Review Queue', 'group' => 'Auditing'],
            
            // Settings & Users
            ['name' => 'manage_users', 'display_name' => 'Manage Users', 'group' => 'System'],
            ['name' => 'manage_settings', 'display_name' => 'Manage Settings', 'group' => 'System'],
            ['name' => 'sync_records', 'display_name' => 'Sync Records', 'group' => 'System'],
            ['name' => 'view_logs', 'display_name' => 'View Logs', 'group' => 'System'],
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm['name']], $perm);
        }

        // 2. Create Roles
        $adminRole = Role::firstOrCreate(['name' => 'admin'], [
            'display_name' => 'Admin',
            'color' => 'cyan',
            'description' => 'Full access — events, users, reports'
        ]);
        $adminRole->permissions()->sync(Permission::pluck('id')); // All permissions

        $dataEntryRole = Role::firstOrCreate(['name' => 'data_entry'], [
            'display_name' => 'Data Entry',
            'color' => 'emerald',
            'description' => 'Can register and print, view basic events'
        ]);
        $dataEntryRole->permissions()->sync(Permission::whereIn('name', [
            'view_events', 'register_visitors', 'register_media', 'print_badges'
        ])->pluck('id'));

        $auditorRole = Role::firstOrCreate(['name' => 'auditor'], [
            'display_name' => 'Auditor',
            'color' => 'purple',
            'description' => 'Can review queues and correct records'
        ]);
        $auditorRole->permissions()->sync(Permission::whereIn('name', [
            'audit_records', 'review_queue'
        ])->pluck('id'));

        $selfServiceRole = Role::firstOrCreate(['name' => 'self_service_device'], [
            'display_name' => 'Self Service Device',
            'color' => 'pink',
            'description' => 'Device account for self registration apps'
        ]);
        $selfServiceRole->permissions()->sync(Permission::whereIn('name', [
            'register_visitors'
        ])->pluck('id'));

        // 3. Fallback: since role string was dropped, assign admin to user id 1, and data_entry to others
        $users = DB::table('users')->whereNull('role_id')->get();
        foreach ($users as $user) {
            $roleId = ($user->id == 1) ? $adminRole->id : $dataEntryRole->id;
            // You can also look at their email to determine admin if needed
            DB::table('users')->where('id', $user->id)->update(['role_id' => $roleId]);
        }
    }
}
