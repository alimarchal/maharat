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
        Schema::create('transactions_flow', function (Blueprint $table) {
            $table->id();
            
            // Main transaction details
            $table->foreignId('account_id')->constrained('accounts')->onDelete('cascade');
            $table->enum('transaction_type', ['credit', 'debit']);
            $table->decimal('amount', 15, 2);
            $table->decimal('balance_after', 15, 2)->comment('Account balance after this transaction');
            
            // Related entity details
            $table->string('related_entity_type')->nullable()->comment('invoice, cash_transaction, etc.');
            $table->unsignedBigInteger('related_entity_id')->nullable()->comment('ID of the related entity');
            
            // Related accounts that were affected in the same transaction
            $table->json('related_accounts')->nullable()->comment('JSON array of related account changes');
            
            // Transaction metadata
            $table->text('description')->nullable();
            $table->string('reference_number')->nullable();
            $table->date('transaction_date');
            
            // Audit fields
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['account_id', 'transaction_date']);
            $table->index(['related_entity_type', 'related_entity_id']);
            $table->index('transaction_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions_flow');
    }
};
