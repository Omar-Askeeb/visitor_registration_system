<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('exhibitors', function (Blueprint $table) {
            $table->integer('number_of_vip_cards')->default(0)->after('extra_badges');
            $table->boolean('vip_cards_received')->default(false)->after('number_of_vip_cards');
        });
    }

    public function down(): void
    {
        Schema::table('exhibitors', function (Blueprint $table) {
            $table->dropColumn(['number_of_vip_cards', 'vip_cards_received']);
        });
    }
};
