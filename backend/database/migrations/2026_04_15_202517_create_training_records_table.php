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
        Schema::create('training_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('formID')->nullable(); // Not unique for training
            $table->string('badgeID')->nullable();
            $table->string('visitorName')->nullable();
            $table->string('midleName')->nullable();
            $table->string('surName')->nullable();
            $table->string('organisation')->nullable();
            $table->string('email')->nullable();
            $table->string('phone1')->nullable();
            $table->string('phone2')->nullable();
            $table->string('gender')->nullable();
            $table->string('nationality')->nullable();
            $table->string('resident')->nullable();
            $table->json('workfield')->nullable();
            $table->json('howexpo')->nullable();
            $table->float('fill_duration')->nullable(); // Seconds
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('training_records');
    }
};
