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
        Schema::create('budget_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_category_id')->nullable()->constrained('budget_categories', 'id')->comment('Reference to parent category for hierarchical categorization');
            $table->foreignId('account_id')->nullable()->constrained('accounts', 'id')->comment('Reference to associated financial account in the chart of accounts');
            $table->string('name')->comment('The display name of the budget category');
            $table->string('code')->unique()->nullable()->comment('A unique identifier code for the category, often used in reports');
            $table->text('description')->nullable()->comment('Detailed description explaining the purpose and scope of this category');
            $table->boolean('is_active')->default(true)->comment('Flag indicating if this category is currently in use');
            $table->foreignId('created_by')->constrained('users', 'id')->comment('Reference to the user who created this category');
            $table->foreignId('updated_by')->nullable()->constrained('users', 'id')->comment('Reference to the user who last updated this category');
            $table->timestamps();
            $table->softDeletes();
        });
/*
        // Insert sample data
        DB::table('budget_categories')->insert([
            [
                'id' => 1,
                'name' => 'Operating Expenses',
                'code' => 'OPEX',
                'description' => 'All operational expenses for day-to-day business activities',
                'is_active' => true,
                'parent_category_id' => null,
                'account_id' => 1, // Assuming account ID 1 exists
                'created_by' => 1, // Assuming user ID 1 exists
                'updated_by' => null,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => 2,
                'name' => 'Capital Expenditures',
                'code' => 'CAPEX',
                'description' => 'Long-term investments in physical assets',
                'is_active' => true,
                'parent_category_id' => null,
                'account_id' => 2, // Assuming account ID 2 exists
                'created_by' => 1,
                'updated_by' => null,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => 3,
                'name' => 'Utilities',
                'code' => 'UTIL',
                'description' => 'Expenses for electricity, water, internet, etc.',
                'is_active' => true,
                'parent_category_id' => 1, // Child of Operating Expenses
                'account_id' => 3, // Assuming account ID 3 exists
                'created_by' => 1,
                'updated_by' => null,
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'id' => 4,
                'name' => 'IT Equipment',
                'code' => 'ITEQ',
                'description' => 'Computers, servers, and other IT hardware',
                'is_active' => true,
                'parent_category_id' => 2, // Child of Capital Expenditures
                'account_id' => 4, // Assuming account ID 4 exists
                'created_by' => 1,
                'updated_by' => null,
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
*/
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('budget_categories');
    }
};
