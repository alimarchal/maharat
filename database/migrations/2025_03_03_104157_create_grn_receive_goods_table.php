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
        Schema::create('grn_receive_goods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->comment('Created By')->constrained('users', 'id');
            $table->foreignId('supplier_id')->nullable()->comment('Supplier Good Received')->constrained();
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders', 'id');
            $table->foreignId('quotation_id')->nullable()->constrained('quotations', 'id');
            $table->decimal('quantity_quoted', 4,2)->nullable()->comment('Quotation Quoted in Quotation');
            $table->date('due_delivery_date')->nullable()->comment('Due Delivery Date');
            $table->string('receiver_name')->nullable()->comment('Receiver Name');
            $table->string('upc')->nullable();
            $table->foreignId('category_id')->nullable()->constrained('product_categories','id');
            $table->decimal('quantity_delivered', 4,2)->nullable()->comment('Delivery Quantity ');
            $table->date('delivery_date')->nullable()->comment('Delivery Date');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grn_receive_goods');
    }
};
