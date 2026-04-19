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
            $table->boolean('email_enabled')->default(false)->after('badge_layout');
            $table->string('email_subject')->nullable()->after('email_enabled');
            $table->text('email_body')->nullable()->after('email_subject');
            $table->string('email_from_name')->nullable()->after('email_body');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['email_enabled', 'email_subject', 'email_body', 'email_from_name']);
        });
    }
};
