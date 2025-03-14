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
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('process_step_id')->nullable()->comment('Task Name')->constrained('process_steps', 'id');
            $table->foreignId('process_id')->nullable()->comment('Type RFQ or Material Type')->constrained('processes', 'id');
            $table->dateTime('assigned_at')->nullable();
            $table->dateTime('deadline')->nullable();
            $table->enum('urgency', ['Normal', 'Medium', 'High', 'Low', 'ASAP'])->default('Normal');
            $table->foreignId('assigned_user_id')->nullable()->comment('From')->constrained('users', 'id');
            $table->dateTime('read_status')->nullable();
            $table->enum('status',['Pending','Approved','Rejected','Referred'])->default('Pending');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
