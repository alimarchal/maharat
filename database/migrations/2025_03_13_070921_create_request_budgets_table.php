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
        Schema::create('request_budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('fiscal_period_id')->nullable()->comment('fiscal_periods is actual year')->constrained('fiscal_periods', 'id');
            $table->foreignId('department_id')->nullable()->constrained('departments', 'id');
            $table->foreignId('cost_center_id')->nullable()->constrained('cost_centers', 'id');
            $table->foreignId('sub_cost_center')->nullable()->constrained('cost_centers', 'id');
            $table->decimal('previous_year_budget_amount', 15, 2)->nullable();
            $table->decimal('requested_amount', 15, 2)->nullable();
            $table->decimal('approved_amount', 15, 2)->nullable();
            $table->enum('urgency', ['High', 'Medium', 'Low'])->default(NULL)->nullable();
            $table->string('attachment_path')->nullable();
            $table->text('reason_for_increase')->nullable();
            $table->enum('status', ['Draft', 'Submitted', 'Referred','Approved','Rejected','Pending'])->default(NULL)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users', 'id');
            $table->foreignId('updated_by')->nullable()->constrained('users', 'id');
            $table->timestamps();
            $table->softDeletes();  // For archiving without deletion

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('request_budgets');
    }
};
