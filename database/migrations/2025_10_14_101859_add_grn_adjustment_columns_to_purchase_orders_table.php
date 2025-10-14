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
            $table->enum('grn_status', ['Adjusted'])->nullable()->comment('GRN adjustment status');
            $table->decimal('adjusted_amount', 15, 2)->nullable()->comment('Amount adjusted due to GRN');
            $table->decimal('adjusted_tax', 15, 2)->nullable()->comment('Tax adjusted due to GRN');
            $table->decimal('original_amount', 15, 2)->nullable()->comment('Original amount before GRN adjustment');
            $table->decimal('original_vat_amount', 15, 2)->nullable()->comment('Original VAT amount before GRN adjustment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropColumn([
                'grn_status',
                'adjusted_amount', 
                'adjusted_tax',
                'original_amount',
                'original_vat_amount'
            ]);
        });
    }
};
