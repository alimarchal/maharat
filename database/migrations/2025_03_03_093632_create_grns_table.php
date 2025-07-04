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
        Schema::create('grns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->comment('Created By')->constrained('users', 'id')->onDelete('SET NULL'); 
            $table->string('grn_number')->comment("Good Receiving Notes Number NO (e.g., GRN-2023-0001)")->unique();
            $table->foreignId('quotation_id')->nullable()->constrained('quotations', 'id')->onDelete('CASCADE');
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders', 'id')->onDelete('CASCADE'); 
            $table->decimal('quantity', 15, 2)->comment("Quantity")->default(0);
            $table->date('delivery_date')->comment("Delivery Date")->default(DB::raw('CURRENT_TIMESTAMP'));

            $table->softDeletes();
            $table->timestamps();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grns');
    }
};
