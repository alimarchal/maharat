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
        Schema::create('units', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->string('short_title')->nullable();
            $table->timestamps();
        });

        Schema::create('product_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('brands', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->comment('created_by')->constrained('users');
            $table->foreignId('category_id')->nullable()->constrained('product_categories','id');
            $table->string('name')->nullable();
            $table->foreignId('status_id')->nullable()->constrained('statuses', 'id');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('product_categories');
            $table->foreignId('unit_id')->constrained('units'); // unit_of_measurement
            $table->string('name')->nullable();
            $table->string('upc', 12)->nullable()->unique();
            $table->text('description')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('inventories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses');
            $table->foreignId('product_id')->nullable()->constrained('products');
            $table->decimal('quantity', 15, 4)->default(0);
            $table->decimal('reorder_level', 15, 4)->default(0);
            // $table->decimal('safety_stock', 15, 4)->default(0);
            $table->timestamps();
            $table->unique(['warehouse_id', 'product_id']);
        });


        Schema::create('inventory_adjustments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->nullable()->constrained('warehouses');
            $table->foreignId('product_id')->nullable()->constrained('products');
            $table->text('purchase_order_number')->nullable(); // PO#
            $table->decimal('quantity', 15, 4)->default(0);
            $table->foreignId('reason')->constrained('statuses', 'id');
            $table->text('description')->nullable();
            $table->foreignId('approved_by')->constrained('users');
            $table->timestamps();
        });


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


        // need to discuss
        Schema::create('product_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products');
            $table->string('batch_number')->unique();
            $table->date('manufacture_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->timestamps();
        });



    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_batches');
        Schema::dropIfExists('inventory_transfers');
        Schema::dropIfExists('inventory_adjustments');
        Schema::dropIfExists('inventories');
        Schema::dropIfExists('products');
        Schema::dropIfExists('brands');
        Schema::dropIfExists('product_categories');
        Schema::dropIfExists('units');
    }
};
