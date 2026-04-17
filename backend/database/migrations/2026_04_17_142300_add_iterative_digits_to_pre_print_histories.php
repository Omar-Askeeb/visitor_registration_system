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
        Schema::table('pre_print_histories', function (Blueprint $table) {
            $table->integer('iterative_digits')->default(5)->after('batch_size');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pre_print_histories', function (Blueprint $table) {
            $table->dropColumn('iterative_digits');
        });
    }
};
