<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visitors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->string('formID')->unique();
            $table->string('badgeID')->nullable()->unique();
            $table->string('onlineRegID')->nullable()->unique()->comment('Online registration visitor ID');
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
            $table->text('workfield')->nullable();
            $table->text('howexpo')->nullable();
            $table->foreignId('modifier')->nullable()->constrained('users')->nullOnDelete();
            $table->integer('modifyUnits')->default(0);
            $table->integer('insertUnits')->default(0);
            $table->timestamp('modifydate')->nullable();
            $table->integer('modifyCount')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visitors');
    }
};
