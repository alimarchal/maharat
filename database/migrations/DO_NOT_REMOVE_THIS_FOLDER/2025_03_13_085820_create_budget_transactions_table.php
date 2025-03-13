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
        Schema::create('budget_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('budget_id')->constrained('budgets', 'id')->comment('Reference to the budget being charged or affected by this transaction');
            $table->foreignId('account_id')->nullable()->constrained('accounts', 'id')->comment('Reference to the financial account associated with this transaction');
            $table->string('transaction_reference')->nullable()->comment('A unique reference code for tracking this transaction, may link to external systems');
            $table->enum('transaction_type', ['Expense', 'Commitment', 'Adjustment', 'Release'])->comment('Classifies the transaction as an actual expense, a commitment of funds, an adjustment, or a release of previously committed funds');
            $table->decimal('amount', 15, 2)->comment('The monetary amount of the transaction');
            $table->date('transaction_date')->comment('The date when the transaction occurred');
            $table->text('description')->nullable()->comment('Detailed description of the transaction purpose');
            $table->string('attachment_path')->nullable()->comment('Path to any supporting documents attached to this transaction');
            $table->foreignId('created_by')->constrained('users', 'id')->comment('Reference to the user who recorded this transaction');
            $table->foreignId('approved_by')->nullable()->constrained('users', 'id') ->comment('Reference to the user who approved this transaction');
            $table->timestamp('approved_at')->nullable()->comment('Timestamp when this transaction was approved');
            $table->timestamps();
            $table->softDeletes()->comment('Enables archiving of transaction records without permanent deletion');
        });
/*
        // Insert sample data
        DB::table('budget_transactions')->insert([
            [
                'budget_id' => 1, // Utilities budget
                'account_id' => 3, // Utilities account
                'transaction_reference' => 'EXP-2025-001',
                'transaction_type' => 'Expense',
                'amount' => 8500.00,
                'transaction_date' => now()->subDays(15),
                'description' => 'Monthly electricity bill for headquarters',
                'attachment_path' => 'attachments/bills/electricity_jan_2025.pdf',
                'created_by' => 3,
                'approved_by' => 2,
                'approved_at' => now()->subDays(14),
                'created_at' => now()->subDays(15),
                'updated_at' => now()->subDays(15)
            ],
            [
                'budget_id' => 1, // Utilities budget
                'account_id' => 3, // Utilities account
                'transaction_reference' => 'EXP-2025-002',
                'transaction_type' => 'Expense',
                'amount' => 3200.00,
                'transaction_date' => now()->subDays(10),
                'description' => 'Monthly water and sewage bill',
                'attachment_path' => 'attachments/bills/water_jan_2025.pdf',
                'created_by' => 3,
                'approved_by' => 2,
                'approved_at' => now()->subDays(9),
                'created_at' => now()->subDays(10),
                'updated_at' => now()->subDays(10)
            ],
            [
                'budget_id' => 2, // IT Equipment budget
                'account_id' => 4, // IT Equipment account
                'transaction_reference' => 'COM-2025-001',
                'transaction_type' => 'Commitment',
                'amount' => 45000.00,
                'transaction_date' => now()->subDays(5),
                'description' => 'Purchase order for 15 new laptops for Development team',
                'attachment_path' => 'attachments/purchase_orders/po_dev_laptops.pdf',
                'created_by' => 4,
                'approved_by' => 2,
                'approved_at' => now()->subDays(4),
                'created_at' => now()->subDays(5),
                'updated_at' => now()->subDays(5)
            ]
        ]);
*/
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('budget_transactions');
    }
};
