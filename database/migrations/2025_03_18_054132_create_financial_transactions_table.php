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
        Schema::create('financial_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_code_id')->nullable()->constrained('account_codes', 'id')->nullOnDelete();
            $table->foreignId('chart_of_account_id')->nullable()->constrained('chart_of_accounts', 'id')->nullOnDelete();
            $table->foreignId('account_id')->nullable()->constrained('accounts', 'id')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('departments', 'id')->nullOnDelete();
            $table->foreignId('cost_center_id')->nullable()->constrained('cost_centers', 'id')->nullOnDelete();
            $table->foreignId('sub_cost_center_id')->nullable()->constrained('cost_centers', 'id')->nullOnDelete();

            $table->date('transaction_date')->comment('Date of the transaction');
            $table->enum('entry_type', ['Regular', 'Adjustment', 'Closing', 'Opening', 'Reversal'])->default('Regular');
            $table->enum('status', ['Draft', 'Posted', 'Approved', 'Canceled', 'Reversed'])->default('Draft');
            $table->foreignId('fiscal_period_id')->nullable()->constrained('fiscal_periods')->nullOnDelete();
            $table->string('reference_number')->nullable()->comment('External reference number or source document');
            $table->decimal('amount', 15, 2)->default(0)->comment('Transaction amount');
            $table->text('description')->nullable()->comment('Description of the journal');

            // Audit fields
            $table->foreignId('created_by')->nullable()->comment('User who created this record')->constrained('users', 'id');
            $table->foreignId('updated_by')->nullable()->comment('User who last updated this record')->constrained('users', 'id');
            $table->foreignId('approved_by')->nullable()->comment('User who approved this record')->constrained('users', 'id');
            $table->timestamp('approved_at')->nullable()->comment('Timestamp when the entry was approved');
            $table->timestamp('posted_at')->nullable()->comment('Timestamp when the entry was posted to the ledger');
            // Indexes for performance
            $table->index('transaction_date');
            $table->index('status');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_transactions');
    }
};
