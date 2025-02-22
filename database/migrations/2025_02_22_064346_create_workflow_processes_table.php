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
        Schema::create('workflow_processes', function (Blueprint $table) {
            $table->id();
            // $table->foreignId('reason')->constrained('statuses', 'id');
            $table->foreignId('user_id')->comment('Employee assigned to this workflow step')->constrained('users');
            $table->string('name')->comment('Process name like Purchase Approval, Leave Request');
            $table->string('code')->unique()->comment('Unique identifier for the process');
            $table->string('description')->nullable();
            $table->integer('order')->nullable()->comment('Step sequence in workflow');
            $table->foreignId('workflow_type_id')->comment('Type of workflow from statuses')->constrained('statuses');
            $table->text('conditions')->nullable()->comment('Conditional logic for approval');
            $table->text('notification_settings')->nullable()->comment('Email/SMS notification preferences');
            $table->integer('approval_timeout')->nullable()->comment('Hours before escalation');
            $table->foreignId('escalation_user_id')->nullable()->constrained('users')->comment('User for timeout escalation');
            $table->boolean('requires_attachment')->default(false);
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('workflow_processes');
    }
};
