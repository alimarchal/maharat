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
        Schema::create('task_descriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->nullable()->constrained('tasks', 'id');
            $table->string('description')->comment('task action description')->nullable();
            $table->enum('action', ['Approve', 'Reject', 'Refer', 'Normal'])->default('Normal');
            $table->foreignId('user_id')->nullable()->comment('Refer User ID')->constrained('users', 'id');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_descriptions');
    }
};
