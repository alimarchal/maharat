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
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->comment('Created By')->constrained('users', 'id');
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses');
            $table->foreignId('department_id')->nullable()->constrained('departments', 'id');
            $table->foreignId('cost_center_id')->nullable()->constrained('cost_centers', 'id');
            $table->foreignId('sub_cost_center_id')->nullable()->constrained('cost_centers', 'id');
            $table->string('purchase_order_no')->comment("Purchase Order Number NO (e.g., PO-2023-001)")->unique();
            $table->foreignId('quotation_id')->nullable()->constrained('quotations', 'id');
            $table->foreignId('supplier_id')->nullable()->comment('Supplier who submitted the quotation')->constrained();
            $table->date('purchase_order_date')->useCurrent()->comment("Purchase Order Date");
            $table->decimal('amount',15,2)->default(0)->comment("Amount");
            $table->string('attachment')->nullable()->comment("Attachment");
            $table->enum('status',['Approved','Draft', 'Rejected'])->default('Approved');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_orders');
    }
};
