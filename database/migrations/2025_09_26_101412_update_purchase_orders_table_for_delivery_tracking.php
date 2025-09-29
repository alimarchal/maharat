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
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->boolean('has_good_receive_note')->default(false)
                  ->after('status')
                  ->comment('Whether this PO has any GRN created');
            
            $table->enum('delivery_status', ['pending', 'partially_delivered', 'completed', 'delivered'])
                  ->default('pending')
                  ->after('has_good_receive_note')
                  ->comment('Overall delivery status of the purchase order');
            
            $table->decimal('delivered_amount', 15, 2)->default(0)
                  ->after('vat_amount')
                  ->comment('Total amount for delivered items');
            
            $table->decimal('pending_amount', 15, 2)->default(0)
                  ->after('delivered_amount')
                  ->comment('Amount for items still pending delivery');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropColumn([
                'has_good_receive_note', 
                'delivery_status', 
                'delivered_amount', 
                'pending_amount'
            ]);
        });
    }
};
