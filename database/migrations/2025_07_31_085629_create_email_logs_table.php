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
        Schema::create('email_logs', function (Blueprint $table) {
            $table->id();
            
            // Email details
            $table->string('email_type'); // 'task_assignment', 'task_status', 'welcome', 'password_reset', etc.
            $table->string('subject');
            $table->text('content_summary')->nullable(); // Brief summary of email content
            
            // Recipient information
            $table->foreignId('recipient_user_id')->nullable()->constrained('users', 'id')->onDelete('set null');
            $table->string('recipient_email');
            $table->string('recipient_name')->nullable();
            
            // Sender information (system user who triggered the email)
            $table->foreignId('triggered_by_user_id')->nullable()->constrained('users', 'id')->onDelete('set null');
            
            // Related records (for context)
            $table->foreignId('task_id')->nullable()->constrained('tasks', 'id')->onDelete('set null');
            $table->foreignId('material_request_id')->nullable()->constrained('material_requests', 'id')->onDelete('set null');
            $table->foreignId('rfq_id')->nullable()->constrained('rfqs', 'id')->onDelete('set null');
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders', 'id')->onDelete('set null');
            $table->foreignId('payment_order_id')->nullable()->constrained('payment_orders', 'id')->onDelete('set null');
            $table->foreignId('invoice_id')->nullable()->constrained('invoices', 'id')->onDelete('set null');
            $table->foreignId('budget_id')->nullable()->constrained('budgets', 'id')->onDelete('set null');
            $table->foreignId('request_budget_id')->nullable()->constrained('request_budgets', 'id')->onDelete('set null');
            
            // Email status and metadata
            $table->enum('status', ['pending', 'sent', 'failed', 'bounced'])->default('pending');
            $table->text('error_message')->nullable(); // If email failed
            $table->string('mail_provider')->nullable(); // 'smtp', 'mailgun', etc.
            $table->string('message_id')->nullable(); // Provider's message ID
            
            // Additional context
            $table->json('metadata')->nullable(); // Any additional data in JSON format
            $table->text('notes')->nullable(); // Admin notes
            
            // Timestamps
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            
            // Indexes for better performance
            $table->index(['email_type', 'status']);
            $table->index(['recipient_user_id', 'created_at']);
            $table->index(['task_id', 'created_at']);
            $table->index(['status', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_logs');
    }
};
