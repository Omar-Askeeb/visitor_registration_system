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
            $table->string('email_send_status')->nullable()->default('pending')->after('external_sync_error');
            $table->timestamp('email_sent_at')->nullable()->after('email_send_status');
            $table->text('email_send_error')->nullable()->after('email_sent_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('visitors', function (Blueprint $table) {
            $table->dropColumn(['email_send_status', 'email_sent_at', 'email_send_error']);
        });
    }
};
