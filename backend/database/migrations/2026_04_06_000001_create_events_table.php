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
            $table->string('online_slug')->nullable()->unique();
            
            // Sync settings
            $table->boolean('sync_enabled')->default(0);
            $table->string('sync_url')->nullable();
            $table->integer('sync_interval')->default(60)->comment('Interval in minutes');
            $table->integer('sync_countdown')->default(0);
            
            // Remote DB settings
            $table->string('remote_db_host')->nullable();
            $table->string('remote_db_name')->nullable();
            $table->string('remote_db_user')->nullable();
            $table->string('remote_db_pass')->nullable();
            
            // Dynamic form options
            $table->json('workfield_options')->nullable();
            $table->json('howexpo_options')->nullable();
            
            // Training settings
            $table->boolean('is_training')->default(0);
            
            // Layout settings
            $table->json('badge_layout')->nullable();

            // Email settings
            $table->boolean('email_enabled')->default(0);
            $table->string('email_subject')->nullable();
            $table->text('email_body')->nullable();
            $table->string('email_from_name')->nullable();

            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
