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
        Schema::dropIfExists('inventories');
        Schema::dropIfExists('inventory_adjustments');
        Schema::dropIfExists('inventory_transfers');

        Schema::create('inventories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->comment('Created By')->constrained('users', 'id');
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses');
            $table->foreignId('product_id')->nullable()->constrained('products');
            $table->decimal('quantity', 15, 4)->default(0);
            $table->decimal('reorder_level', 15, 4)->default(0)->comment('Minimum stock level that triggers replenishment');
            $table->text('description')->nullable();
            //$table->decimal('safety_stock', 15, 4)->default(0)->comment('Buffer stock to maintain during lead time');
            $table->timestamps();
            $table->unique(['warehouse_id', 'product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventories');
    }
};
