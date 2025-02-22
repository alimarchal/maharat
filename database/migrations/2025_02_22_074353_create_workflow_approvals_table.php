<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
//        Schema::create('workflow_approvals', function (Blueprint $table) {
//            $table->id()->comment('Primary key');
//            $table->morphs('approvable');
//            $table->foreignId('workflow_process_id')->constrained()->comment('Reference to workflow process configuration');
//            $table->foreignId('approver_id')->constrained('users')->comment('User responsible for approval');
//            $table->enum('status', [
//                'pending',     // Initial state
//                'in_progress', // Being reviewed
//                'approved',    // Approved by approver
//                'rejected',    // Rejected by approver
//                'on_hold',     // Temporarily paused
//                'escalated'    // Escalated to higher authority
//            ])->default('pending')->comment('Current approval status');
//            $table->text('comments')->nullable()->comment('Approver comments or feedback');
//            $table->json('attachments')->nullable()->comment('Document references and file paths');
//            $table->json('approval_data')->nullable()->comment('Additional metadata for approval process');
//            $table->timestamp('due_date')->nullable()->comment('Deadline for approval decision');
//            $table->timestamp('action_taken_at')->nullable()->comment('When approver made decision');
//            $table->foreignId('company_id')->constrained()->comment('Organization context');
//            $table->timestamps();
//            $table->softDeletes()->comment('Soft delete support');
//            $table->index(['status', 'due_date'])->comment('Index for status queries and deadline tracking');
//        });
//
//        Schema::create('workflow_approval_history', function (Blueprint $table) {
//            $table->id()->comment('Primary key');
//            $table->foreignId('workflow_approval_id')->constrained()->cascadeOnDelete()->comment('Reference to main approval record');
//            $table->foreignId('user_id')->constrained()->comment('User who performed the action');
//            $table->enum('action', [
//                'created',          // Initial creation
//                'status_changed',   // Status update
//                'comments_added',   // New comments
//                'attachment_added', // New documents
//                'escalated',       // Escalation event
//                'reassigned'       // Reassignment event
//            ])->comment('Type of history event');
//            $table->string('status')->nullable()->comment('Status at time of change');
//            $table->text('remarks')->nullable()->comment('Additional notes about change');
//            $table->json('changes')->nullable()->comment('Before/after state comparison');
//            $table->string('ip_address', 45)->nullable()->comment('IP address of user');
//            $table->string('user_agent')->nullable()->comment('Browser/client information');
//            $table->timestamps();
//        });
    }

    public function down(): void
    {
//        Schema::dropIfExists('workflow_approval_history');
//        Schema::dropIfExists('workflow_approvals');
    }
};
