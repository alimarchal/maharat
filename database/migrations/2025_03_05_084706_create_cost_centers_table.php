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
        Schema::create('cost_centers', function (Blueprint $table) {
            $table->id(); // Primary key for cost centers
            $table->foreignId('parent_id')->nullable()->comment('Parent cost center for hierarchical structure')->constrained('cost_centers')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->string('code', 20)->unique()->comment('Business-friendly cost center code (e.g., CC001)')->index();
            $table->string('name', 100)->comment('Type name (Department, Project, etc.)')->nullable();
            $table->enum('cost_center_type', ['Fixed', 'Variable','Support','Direct', NULL])->default(NULL);
            $table->text('description')->nullable()->comment('Detailed description of the cost center purpose');
            $table->enum('status', ['Approved', 'Pending'])->default('Approved')->comment('Current status');
            $table->date('effective_start_date')->comment('Date when the cost center becomes active')->default(date('Y-m-d'));
            $table->date('effective_end_date')->nullable()->comment('Date when the cost center expires');
            $table->foreignId('manager_id')->nullable()->comment('Employee who manages this cost center')->constrained('users', 'id')->onDelete('set null');
            $table->foreignId('budget_owner_id')->nullable()->comment('Employee who owns the budget')->constrained('users', 'id')->onDelete('set null');
            $table->foreignId('created_by')->nullable()->comment('User who created this record')->constrained('users', 'id');
            $table->foreignId('updated_by')->nullable()->comment('User who last updated this record')->constrained('users', 'id');
            $table->timestamps();
            $table->softDeletes();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cost_centers');
    }
};
