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
        Schema::table('budget_reallocation_history', function (Blueprint $table) {
            $table->enum('source_type', ['budget_reallocation', 'purchase_order'])->nullable()->after('reallocation_request_id')->comment('Source of reallocation: budget_reallocation or purchase_order');
            $table->unsignedBigInteger('purchase_order_id')->nullable()->after('source_type')->comment('Purchase order ID if reallocation is from purchase order');
            $table->decimal('source_old_requested_amount', 15, 2)->nullable()->after('source_old_approved_amount')->comment('Source requested_amount before reallocation');
            $table->decimal('destination_old_requested_amount', 15, 2)->nullable()->after('destination_old_approved_amount')->comment('Destination requested_amount before reallocation');
            
            // Add foreign key for purchase_order_id
            $table->foreign('purchase_order_id', 'brh_po_id_fk')->references('id')->on('purchase_orders');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('budget_reallocation_history', function (Blueprint $table) {
            $table->dropForeign('brh_po_id_fk');
            $table->dropColumn([
                'source_type',
                'purchase_order_id',
                'source_old_requested_amount',
                'destination_old_requested_amount'
            ]);
        });
    }
};
