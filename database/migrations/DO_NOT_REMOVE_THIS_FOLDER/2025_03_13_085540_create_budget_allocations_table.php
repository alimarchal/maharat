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
        Schema::create('budget_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('budget_id')->constrained('budgets', 'id')->comment('Reference to the budget receiving this allocation');
            $table->foreignId('fiscal_period_id')->constrained('fiscal_periods', 'id')->comment('Reference to the fiscal period this allocation applies to');
            $table->foreignId('request_budget_id')->nullable()->constrained('request_budgets', 'id')->comment('Reference to the budget request that prompted this allocation, if applicable');
            $table->foreignId('account_id')->nullable()->constrained('accounts', 'id')->comment('Reference to the financial account associated with this allocation');
            $table->decimal('amount', 15, 2)->comment('The monetary amount being allocated, positive for additions, negative for reductions');
            $table->enum('allocation_type', ['Initial', 'Adjustment', 'Transfer'])->comment('Indicates whether this is an initial budget allocation, an adjustment, or part of a transfer');
            $table->text('notes')->nullable()->comment('Additional context or justification for this allocation');
            $table->foreignId('created_by')->constrained('users', 'id')->comment('Reference to the user who created this allocation record');
            $table->foreignId('approved_by')->nullable()->constrained('users', 'id')->comment('Reference to the user who approved this allocation');
            $table->timestamp('approved_at')->nullable()->comment('Timestamp when this allocation was approved');
            $table->timestamps();
            $table->softDeletes();
        });
/*
        // Insert sample data
        DB::table('budget_allocations')->insert([
            [
                'budget_id' => 1, // Utilities budget
                'fiscal_period_id' => 1, // Fiscal period 2025
                'amount' => 120000.00,
                'allocation_type' => 'Initial',
                'request_budget_id' => 1,
                'account_id' => 3, // Utilities account
                'notes' => 'Initial annual allocation for utilities',
                'created_by' => 1,
                'approved_by' => 2,
                'approved_at' => now()->subDays(65),
                'created_at' => now()->subDays(65),
                'updated_at' => now()->subDays(65)
            ],
            [
                'budget_id' => 1, // Utilities budget
                'fiscal_period_id' => 1, // Fiscal period 2025
                'amount' => 15000.00,
                'allocation_type' => 'Adjustment',
                'request_budget_id' => 2,
                'account_id' => 3, // Utilities account
                'notes' => 'Additional allocation due to increased electricity rates',
                'created_by' => 1,
                'approved_by' => 2,
                'approved_at' => now()->subDays(30),
                'created_at' => now()->subDays(35),
                'updated_at' => now()->subDays(30)
            ],
            [
                'budget_id' => 2, // IT Equipment budget
                'fiscal_period_id' => 1, // Fiscal period 2025
                'amount' => 200000.00,
                'allocation_type' => 'Initial',
                'request_budget_id' => 3,
                'account_id' => 4, // IT Equipment account
                'notes' => 'Initial allocation for IT equipment purchases',
                'created_by' => 1,
                'approved_by' => 2,
                'approved_at' => now()->subDays(65),
                'created_at' => now()->subDays(65),
                'updated_at' => now()->subDays(65)
            ]
        ]);
*/
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('budget_allocations');
    }
};
