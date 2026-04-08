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
        Schema::table('events', function (Blueprint $table) {
            $table->json('workfield_options')->nullable();
            $table->json('howexpo_options')->nullable();
        });

        Schema::table('visitors', function (Blueprint $table) {
            $table->boolean('is_verified')->default(false);
            $table->foreignId('verified_by_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('verification_type', ['direct', 'fixed'])->nullable();
            $table->text('verification_notes')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['workfield_options', 'howexpo_options']);
        });

        Schema::table('visitors', function (Blueprint $table) {
            $table->dropConstrainedForeignId('verified_by_id');
            $table->dropColumn(['is_verified', 'verification_type', 'verification_notes']);
        });
    }
};
