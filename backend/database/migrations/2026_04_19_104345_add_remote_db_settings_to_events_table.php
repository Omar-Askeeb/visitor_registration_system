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
        Schema::table('events', function (Blueprint $table) {
            $table->string('remote_db_host')->nullable()->after('sync_countdown');
            $table->string('remote_db_name')->nullable()->after('remote_db_host');
            $table->string('remote_db_user')->nullable()->after('remote_db_name');
            $table->string('remote_db_pass')->nullable()->after('remote_db_user');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn([
                'remote_db_host',
                'remote_db_name',
                'remote_db_user',
                'remote_db_pass',
            ]);
        });
    }
};
