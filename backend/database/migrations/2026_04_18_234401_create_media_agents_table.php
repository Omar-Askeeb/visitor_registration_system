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
        Schema::create('media_agents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->string('badgeID')->unique()->nullable();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('position')->nullable();
            $table->string('organisation')->nullable();
            $table->string('email')->nullable();
            $table->string('phone1')->nullable();
            $table->boolean('has_whatsapp')->default(false);
            $table->string('phone2')->nullable();
            $table->string('gender')->nullable();
            $table->string('nationality')->nullable();
            $table->string('resident')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media_agents');
    }
};
