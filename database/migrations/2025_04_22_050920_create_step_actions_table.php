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
        // Step Actions/Highlights Table (for interactive elements like arrows, buttons)
        Schema::create('step_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('manual_step_id')->constrained()->onDelete('cascade');
            $table->string('action_type'); // click, hyperlink, button, etc.
            $table->string('label');
            $table->string('url_or_action')->nullable(); // hyperlink or action description
            $table->string('style')->nullable(); // CSS class or style
            $table->integer('order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('step_actions');
    }
};
