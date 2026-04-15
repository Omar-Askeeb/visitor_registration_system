<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('events', function (Blueprint $blueprint) {
            $blueprint->integer('sync_interval')->default(1)->after('sync_url'); // minutes
            $blueprint->integer('sync_countdown')->default(120)->after('sync_interval'); // seconds
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $blueprint) {
            $blueprint->dropColumn(['sync_interval', 'sync_countdown']);
        });
    }
};
