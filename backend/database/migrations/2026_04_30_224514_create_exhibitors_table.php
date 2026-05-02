<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exhibitors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();

            // Type: local | international
            $table->enum('type', ['local', 'international'])->default('local');

            // Shared
            $table->string('company_name_ar')->nullable();
            $table->string('company_name_en')->nullable();
            $table->integer('hall_number')->nullable();
            $table->string('stand_number')->nullable();

            // Local only
            $table->integer('number_of_badges')->default(1);
            $table->string('receiver_name')->nullable();
            $table->string('receiver_phone')->nullable();
            $table->integer('extra_badges')->default(0);
            $table->integer('vip_cards')->default(0);
            $table->boolean('badges_received')->default(false);
            $table->timestamp('badges_received_at')->nullable();

            // International only — stored as JSON array: [{"name": "..."}]
            $table->json('employees')->nullable();
            $table->string('nationality')->nullable();

            // Print tracking
            $table->boolean('is_printed')->default(false);
            $table->timestamp('printed_at')->nullable();
            $table->foreignId('printed_by')->nullable()->constrained('users')->nullOnDelete();

            // Barcode (auto-generated or custom)
            $table->string('barcode_id')->nullable()->unique();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exhibitors');
    }
};
