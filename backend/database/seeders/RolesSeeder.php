<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RolesSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Admin
        User::firstOrCreate(
            ['email' => 'admin@digitalgroup.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('12345678'),
                'role' => 'admin',
            ]
        );

        // 2. Data Entry
        User::firstOrCreate(
            ['email' => 'entry@digitalgroup.com'],
            [
                'name' => 'Data Entry User',
                'password' => Hash::make('12345678'),
                'role' => 'data_entry',
            ]
        );

        // 3. Auditor
        User::firstOrCreate(
            ['email' => 'auditor@digitalgroup.com'],
            [
                'name' => 'Auditor User',
                'password' => Hash::make('12345678'),
                'role' => 'auditor',
            ]
        );
    }
}
