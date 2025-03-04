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
        Schema::create('inventory_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_warehouse_id')->constrained('warehouses');
            $table->foreignId('to_warehouse_id')->constrained('warehouses');
            $table->foreignId('product_id')->constrained();
            $table->decimal('quantity', 15, 4)->default(0);
            $table->foreignId('reason')->constrained('statuses', 'id');
            $table->string('tracking_number')->nullable();
            $table->date('transfer_date')->default(now());
            $table->timestamps();
        });

        Schema::create('inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_id')->constrained('inventories','id');
            $table->enum('transaction_type', ['stock_in', 'stock_out', 'adjustment']);
            $table->decimal('quantity', 10, 4);
            $table->decimal('previous_quantity', 10, 4);
            $table->decimal('new_quantity', 10, 4);
            $table->foreignId('user_id')->nullable()->constrained('users','id');
            $table->string('reference_number')->nullable();
            $table->string('reference_type')->nullable()->comment('Order, Return, Transfer, etc.');
            $table->unsignedBigInteger('reference_id')->nullable()->comment('ID of the related document');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
        Schema::dropIfExists('inventory_transfers');
    }
};
