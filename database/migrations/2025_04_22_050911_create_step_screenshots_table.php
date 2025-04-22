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

        // Step Screenshots Table
        Schema::create('step_screenshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('manual_step_id')->constrained()->onDelete('cascade');
            $table->string('screenshot_path');
            $table->string('alt_text')->nullable();
            $table->string('caption')->nullable();
            $table->string('type')->default('primary'); // primary, secondary, etc.
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('step_screenshots');
    }
};
