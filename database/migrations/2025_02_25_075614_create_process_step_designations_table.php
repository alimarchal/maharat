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
        if (!Schema::hasTable('process_step_designations')) {
        Schema::create('process_step_designations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('process_step_id')->constrained('users');
            $table->foreignId('user_id')->constrained('process_steps');
            $table->string('name')->comment('designation name');
            $table->timestamps();
        });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('process_step_designations');
    }
};
