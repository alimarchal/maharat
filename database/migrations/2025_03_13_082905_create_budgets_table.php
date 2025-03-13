<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fiscal_period_id')->constrained('fiscal_periods', 'id')->comment('Reference to the fiscal year this budget belongs to');
            $table->foreignId('department_id')->nullable()->constrained('departments', 'id')->comment('Department responsible for managing this budget');
            $table->foreignId('cost_center_id')->nullable()->constrained('cost_centers', 'id')->comment('Cost center this budget is assigned to');
            $table->foreignId('budget_category_id')->constrained('budget_categories', 'id')->comment('Category classification for this budget');
            $table->string('budget_code')->unique()->comment('Unique identifier code for this budget');
            $table->string('description')->nullable()->comment('Detailed description of the budget purpose');
            $table->decimal('annual_amount', 15, 2)->comment('Total approved amount for the fiscal year');
            $table->decimal('allocated_amount', 15, 2)->comment('Amount currently allocated (may differ from annual amount due to adjustments)');
            $table->decimal('spent_amount', 15, 2)->default(0)->comment('Amount that has been spent to date');
            $table->decimal('committed_amount', 15, 2)->default(0)->comment('Amount that has been committed but not yet spent');
            $table->decimal('available_amount', 15, 2)->storedAs('allocated_amount - spent_amount - committed_amount')->comment('Remaining available funds (calculated field)');
            $table->enum('status', ['Active', 'Frozen', 'Closed'])->default('Active')->comment('Current status of the budget');
            $table->foreignId('created_by')->constrained('users', 'id')->comment('User who created this budget');
            $table->foreignId('updated_by')->nullable()->constrained('users', 'id')->comment('User who last updated this budget');
            $table->timestamps();
            $table->softDeletes();
        });
/*
        // Insert sample data for budgets
        DB::table('budgets')->insert([
            [
                'id' => 1,
                'fiscal_period_id' => 1, // Assuming fiscal period ID 1 exists for 2025
                'department_id' => 2, // Assuming Facilities department
                'cost_center_id' => 5, // Assuming Facilities cost center
                'budget_category_id' => 3, // Utilities category
                'budget_code' => 'UTIL-2025',
                'description' => 'Annual budget for all utility expenses',
                'annual_amount' => 120000.00,
                'allocated_amount' => 135000.00, // Adjusted from initial amount
                'spent_amount' => 11700.00, // Some expenses recorded
                'committed_amount' => 0.00,
                'status' => 'Active',
                'created_by' => 1, // Finance manager
                'updated_by' => 1,
                'created_at' => now()->subDays(65),
                'updated_at' => now()->subDays(30)
            ],
            [
                'id' => 2,
                'fiscal_period_id' => 1, // Fiscal period 2025
                'department_id' => 3, // Assuming IT department
                'cost_center_id' => 8, // Assuming IT cost center
                'budget_category_id' => 4, // IT Equipment category
                'budget_code' => 'ITEQ-2025',
                'description' => 'Annual budget for IT equipment purchases and replacements',
                'annual_amount' => 200000.00,
                'allocated_amount' => 180000.00, // Reduced after transfer
                'spent_amount' => 0.00,
                'committed_amount' => 45000.00, // Committed for laptop purchase
                'status' => 'Active',
                'created_by' => 1, // Finance manager
                'updated_by' => 1,
                'created_at' => now()->subDays(65),
                'updated_at' => now()->subDays(3)
            ],
            [
                'id' => 3,
                'fiscal_period_id' => 1, // Fiscal period 2025
                'department_id' => 3, // IT department
                'cost_center_id' => 8, // IT cost center
                'budget_category_id' => 1, // Operating Expenses category
                'budget_code' => 'IT-OPEX-2025',
                'description' => 'IT department operational expenses',
                'annual_amount' => 85000.00,
                'allocated_amount' => 85000.00,
                'spent_amount' => 12500.00,
                'committed_amount' => 0.00,
                'status' => 'Active',
                'created_by' => 1, // Finance manager
                'updated_by' => null,
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
        Schema::dropIfExists('budgets');
    }
};
