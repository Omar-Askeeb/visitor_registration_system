<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Event;

class EventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Libya Build 2026
        Event::updateOrCreate(
            ['id' => 1],
            [
                'name' => 'Libya Build 2026',
                'location' => 'Benghazi',
                'start_date' => '2026-04-20',
                'end_date' => '2026-04-23',
                'duration' => 4,
                'badge_id_prefix' => '1101020626',
                'form_id_prefix' => '1101020126',
                'online_reg_prefix' => '11010204263',
                'self_service_prefix' => '1101020726',
                'target_visitors' => 30000,
                'status' => 'completed',
                'is_training' => false,
                'online_slug' => 'libya-build-benghazi-2026',
                'sync_enabled' => false,
                'sync_url' => 'https://eventxcrm.com/api/get-visitors/libya-build-benghazi-2026',
                'sync_interval' => 1,
                'sync_countdown' => 60,
                // New Fields
                'sync_push_enabled' => false,
                'sync_push_url' => 'https://eventxcrm.com/api/register-visitor-onsite',
            ]
        );

        // Horeca Libya 2026
        Event::updateOrCreate(
            ['id' => 2],
            [
                'name' => 'Horeca Libya 2026 - Benghazi',
                'location' => 'Benghazi',
                'start_date' => '2026-05-04',
                'end_date' => '2026-05-07',
                'duration' => 4,
                'badge_id_prefix' => '1002021026',
                'form_id_prefix' => '1002020126',
                'online_reg_prefix' => '10020204262',
                'self_service_prefix' => '10020206264',
                'target_visitors' => 15000,
                'status' => 'upcoming',
                'is_training' => true,
                'sync_enabled' => false,
                'sync_url' => 'https://eventxcrm.com/api/get-leads-horeca',
                'sync_interval' => 1,
                'sync_countdown' => 60,
                // New Fields
                'sync_push_enabled' => true,
                'sync_push_url' => 'https://eventxcrm.com/api/horeca-libya-leads',
            ]
        );
    }
}
