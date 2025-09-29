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
        Schema::table('grn_receive_goods', function (Blueprint $table) {
            $table->enum('delivery_status', ['complete_delivery', 'later_delivery', 'adjust_order'])
                  ->default('complete_delivery')
                  ->after('delivery_date')
                  ->comment('Individual item delivery status');
            
            $table->decimal('quantity_pending', 15, 2)->nullable()
                  ->after('quantity_delivered')
                  ->comment('Quantity still pending for delivery');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grn_receive_goods', function (Blueprint $table) {
            $table->dropColumn(['delivery_status', 'quantity_pending']);
        });
    }
};
