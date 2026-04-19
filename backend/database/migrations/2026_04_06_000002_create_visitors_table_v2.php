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
            $table->string('online_source')->default('onsite');
            $table->timestamp('online_created_at')->nullable();
            
            $table->string('visitorName')->nullable();
            $table->string('midleName')->nullable();
            $table->string('surName')->nullable();
            $table->string('organisation')->nullable();
            $table->string('email')->nullable();
            $table->string('phone1')->nullable();
            $table->boolean('has_whatsapp')->default(0);
            $table->string('phone2')->nullable();
            $table->string('gender')->nullable();
            $table->string('nationality')->nullable();
            $table->string('resident')->nullable();
            $table->text('workfield')->nullable();
            $table->text('howexpo')->nullable();
            
            $table->integer('print_count')->default(0);
            $table->foreignId('creator_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('modifier')->nullable()->constrained('users')->nullOnDelete();
            
            // Audit/Verification fields
            $table->boolean('is_verified')->default(0);
            $table->foreignId('verified_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('verification_type')->nullable(); // phone, email, face, etc.
            $table->text('verification_notes')->nullable();

            // External Sync status
            $table->string('external_sync_status')->default('pending')->comment('pending, synced, failed');
            $table->string('external_sync_id')->nullable();
            $table->text('external_sync_error')->nullable();

            // Email tracking
            $table->string('email_send_status')->nullable()->comment('pending, sent, failed');
            $table->timestamp('email_sent_at')->nullable();
            $table->text('email_send_error')->nullable();

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
