<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visitors', function (Blueprint $table) {
            // Categorized source: onsite | online | self-service
            $table->string('visitor_source', 30)->nullable()->after('online_source');
        });

        // Backfill existing data from online_source
        DB::table('visitors')->where('online_source', 'onsite')->update(['visitor_source' => 'onsite']);
        DB::table('visitors')->where('online_source', 'online')->update(['visitor_source' => 'online']);
        DB::table('visitors')->where('online_source', 'self_register')->update(['visitor_source' => 'self-service']);
    }

    public function down(): void
    {
        Schema::table('visitors', function (Blueprint $table) {
            $table->dropColumn('visitor_source');
        });
    }
};
