<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('location')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->integer('duration')->nullable()->comment('Duration in days');
            $table->string('badge_id_prefix')->default('B-')->comment('e.g. LB- for Libya Build badges');
            $table->string('form_id_prefix')->default('F-')->comment('e.g. F- for form IDs');
            $table->string('online_reg_prefix')->default('ON-')->comment('e.g. ON- for online registration visitor IDs');
            $table->integer('target_visitors')->default(0)->comment('Target number of visitors');
            $table->string('status')->default('upcoming')->comment('upcoming, active, completed');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
