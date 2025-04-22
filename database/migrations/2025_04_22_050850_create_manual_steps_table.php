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
        // Manual Steps Table
        Schema::create('manual_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_manual_id')->constrained()->onDelete('cascade');
            $table->integer('step_number');
            $table->string('title');
            $table->text('description');
            $table->string('action_type')->nullable(); // click, navigate, etc.
            $table->integer('order')->default(0); // For sorting
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['user_manual_id', 'step_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('manual_steps');
    }
};
