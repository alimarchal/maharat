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
        Schema::create('workflow_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained('workflow_setups')->cascadeOnDelete();
            $table->foreignId('level_id')->constrained('levels')->cascadeOnDelete();
            $table->integer('order');
            $table->json('conditions')->nullable();
            $table->timestamps();

            $table->unique(['workflow_id', 'level_id', 'order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workflow_levels');
    }
};
