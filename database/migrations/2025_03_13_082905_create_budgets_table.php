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
            $table->string('description')->nullable()->comment('Detailed description of the budget purpose');
            $table->decimal('total_revenue_planned', 15, 2)->default(0);
            $table->decimal('total_revenue_actual', 15, 2)->default(0);
            $table->decimal('total_expense_planned', 15, 2)->default(0);
            $table->decimal('total_expense_actual', 15, 2)->default(0);
            $table->enum('status', ['Active', 'Frozen', 'Closed'])->default('Active')->comment('Current status of the budget');
            $table->foreignId('created_by')->constrained('users', 'id')->comment('User who created this budget');
            $table->foreignId('updated_by')->nullable()->constrained('users', 'id')->comment('User who last updated this budget');
            $table->string('pdf_link')->nullable()->comment('Link to the saved PDF file');
            $table->string('excel_link')->nullable()->comment('Link to the saved Excel file');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('budgets');
    }
};
