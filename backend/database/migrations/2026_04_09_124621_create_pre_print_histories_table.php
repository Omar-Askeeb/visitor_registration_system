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
        Schema::create('pre_print_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->integer('start_code');
            $table->integer('end_code');
            $table->integer('batch_size')->default(100);
            $table->string('type')->default('badge')->comment('badge, form, etc');
            $table->integer('iterative_digits')->default(0)->comment('Number of digits for iterative counter');
            $table->string('barcode_width')->nullable();
            $table->string('barcode_height')->nullable();
            $table->string('barcode_x')->nullable();
            $table->string('barcode_y')->nullable();
            $table->string('page_width')->nullable();
            $table->string('page_height')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pre_print_histories');
    }
};
