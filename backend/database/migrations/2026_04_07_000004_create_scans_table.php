<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('scans', function (Blueprint $table) {
            $table->foreignId('event_id')->nullable()->constrained('events')->cascadeOnDelete();
            $table->string('barcode')->index();
            $table->dateTime('timestamp')->index();
            $table->string('gate_details')->nullable();
            $table->string('user_data')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('scans');
    }
};
