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
        Schema::table('visitors', function (Blueprint $table) {
            $table->string('external_sync_status')->nullable()->after('online_created_at'); // pending, success, failed
            $table->string('external_sync_id')->nullable()->after('external_sync_status');
            $table->text('external_sync_error')->nullable()->after('external_sync_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('visitors', function (Blueprint $table) {
            $table->dropColumn(['external_sync_status', 'external_sync_id', 'external_sync_error']);
        });
    }
};
