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
        Schema::create('user_manuals', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('video_path')->nullable(); // Changed from video_url to video_path
            $table->string('video_type')->nullable(); // mp4, webm, etc.
            $table->boolean('is_active')->default(true);
            $table->foreignId('card_id')->nullable()->constrained()->onDelete('set null');
            $table->userTracking();
            $table->timestamps();
            $table->softDeletes();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_manuals');
    }
};
