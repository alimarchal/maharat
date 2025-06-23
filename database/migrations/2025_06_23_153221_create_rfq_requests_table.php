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
        Schema::create('rfq_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('quantity');
            $table->foreignId('category_id')->nullable()->constrained('product_categories');
            $table->foreignId('unit_id')->nullable()->constrained('units');
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses');
            $table->foreignId('department_id')->nullable()->constrained('departments');
            $table->foreignId('cost_center_id')->nullable()->constrained('cost_centers');
            $table->foreignId('sub_cost_center_id')->nullable()->constrained('cost_centers');
            $table->string('photo')->nullable();
            $table->enum('status', ['Pending', 'Approved', 'Rejected'])->default('Pending');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->foreignId('rfq_id')->nullable()->constrained('rfqs');
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->boolean('is_requested')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rfq_requests');
    }
};
